export type K6Threshold = {
  metric: string
  rule: string
  passed: boolean
}

export type RunKind = 'warm-up' | 'measured'

export type ResourceSummary = {
  meanCpuPct?: number
  peakCpuPct?: number
  meanRamMb?: number
  peakRamMb?: number
  storageMb?: number
}

export type RunMeta = {
  framework: 'Spring Boot' | 'Django/DRF' | 'Unknown'
  scenario: 'Smoke' | 'Read-heavy' | 'Unknown'
  runKind: RunKind
  runCode: string
  vuLevel?: number
}

export type K6NormalizedSummary = {
  totalRequests: number
  requestsPerSecond: number
  failedRequests: number
  errorRatePct: number
  iterations: number
  durationMs: number
  avgMs: number
  medianMs: number
  p95Ms: number
  p99Ms?: number
  minMs: number
  maxMs: number
  checksPassed: number
  checksFailed: number
  checkPassRatePct: number
  dataReceivedBytes: number
  dataSentBytes: number
  vusPeak: number
  thresholds: K6Threshold[]
}

export type K6ImportedRun = {
  id: string
  importedAtIso: string
  framework: string
  scenario: string
  label: string
  baseUrl?: string
  sourceName: string
  vuLevel: number
  runKind: RunKind
  runCode: string
  resources?: ResourceSummary
  summary: K6NormalizedSummary
  raw: unknown
}

type K6Metric = {
  values?: Record<string, number>
  thresholds?: Record<string, boolean>
  passes?: number
  fails?: number
}

type K6SummaryExport = {
  metrics?: Record<string, K6Metric>
  state?: {
    testRunDurationMs?: number
  }
}

export function parseK6SummaryExport(raw: unknown): K6NormalizedSummary {
  if (!raw || typeof raw !== 'object') {
    throw new Error('The imported file is not valid JSON.')
  }

  const payload = raw as K6SummaryExport
  const metrics = payload.metrics || {}

  const httpReqDuration = metricValues(metrics.http_req_duration)
  const httpReqs = metricValues(metrics.http_reqs)
  const httpReqFailed = metricValues(metrics.http_req_failed)
  const iterations = metricValues(metrics.iterations)
  const dataReceived = metricValues(metrics.data_received)
  const dataSent = metricValues(metrics.data_sent)
  const vus = metricValues(metrics.vus)
  const checksMetric = metrics.checks || {}

  const thresholds = Object.entries(metrics).flatMap(([metricName, metric]) => {
    const defs = metric.thresholds || {}
    return Object.entries(defs).map(([rule, passed]) => ({
      metric: metricName,
      rule,
      passed: Boolean(passed),
    }))
  })

  const totalRequests = num(httpReqs.count)
  const failedRequests = Math.round(totalRequests * num(httpReqFailed.rate))
  const checksPassed = num((checksMetric as any).passes)
  const checksFailed = num((checksMetric as any).fails)
  const totalChecks = checksPassed + checksFailed

  const p99 = firstDefinedOptional(httpReqDuration['p(99)'], httpReqDuration.p99)

  return {
    totalRequests,
    requestsPerSecond: round(num(httpReqs.rate)),
    failedRequests,
    errorRatePct: round(num(httpReqFailed.rate) * 100),
    iterations: num(iterations.count),
    durationMs: round(num(payload.state?.testRunDurationMs)),
    avgMs: round(num(httpReqDuration.avg)),
    medianMs: round(firstDefined(httpReqDuration.med, httpReqDuration['p(50)'])),
    p95Ms: round(firstDefined(httpReqDuration['p(95)'], httpReqDuration.p95)),
    p99Ms: typeof p99 === 'number' ? round(p99) : undefined,
    minMs: round(num(httpReqDuration.min)),
    maxMs: round(num(httpReqDuration.max)),
    checksPassed,
    checksFailed,
    checkPassRatePct: totalChecks ? round((checksPassed / totalChecks) * 100) : 0,
    dataReceivedBytes: num(dataReceived.count),
    dataSentBytes: num(dataSent.count),
    vusPeak: Math.max(num(vus.max), num(vus.value)),
    thresholds,
  }
}

export function detectRunMeta(fileName: string, summary?: K6NormalizedSummary): RunMeta {
  const upper = fileName.toUpperCase()
  const framework = upper.includes('-SB-') || upper.includes('SPRING') ? 'Spring Boot' : upper.includes('-DJ-') || upper.includes('DJANGO') ? 'Django/DRF' : 'Unknown'
  const scenario = upper.includes('SMOKE') ? 'Smoke' : upper.includes('READ') ? 'Read-heavy' : 'Unknown'
  const runCodeMatch = upper.match(/-(W\d+|M\d+)(?:-|\.)/)
  const runCode = runCodeMatch?.[1] || 'M1'
  const runKind: RunKind = runCode.startsWith('W') ? 'warm-up' : 'measured'
  const vuMatch = upper.match(/VU(\d+)/)
  const vuLevel = vuMatch ? Number(vuMatch[1]) : summary?.vusPeak
  return { framework, scenario, runKind, runCode, vuLevel }
}

export function buildLabel(meta: RunMeta) {
  const fw = meta.framework === 'Unknown' ? 'Imported run' : meta.framework === 'Spring Boot' ? 'Spring' : 'Django'
  return `${fw} • ${meta.scenario} • VU${meta.vuLevel ?? '?'} • ${meta.runCode}`
}

export function runMatchKey(meta: { framework: string; scenario: string; vuLevel?: number; runCode: string }) {
  return [meta.framework, meta.scenario, String(meta.vuLevel ?? ''), meta.runCode].join('::')
}

export function parsePidstatReport(text: string): ResourceSummary {
  const lines = text.split(/\r?\n/)
  const samples = new Map<string, { cpu: number; rssKb: number }>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('Linux') || trimmed.startsWith('#')) continue
    if (/^Average:/i.test(trimmed)) continue
    const cols = trimmed.split(/\s+/)
    if (cols.length < 13) continue
    const timeKey = `${cols[0]} ${cols[1]}`
    const cpu = parseFloat(cols[7])
    const rssKb = parseFloat(cols[11])
    if (!Number.isFinite(cpu) || !Number.isFinite(rssKb)) continue
    const existing = samples.get(timeKey) || { cpu: 0, rssKb: 0 }
    existing.cpu += cpu
    existing.rssKb += rssKb
    samples.set(timeKey, existing)
  }

  const values = Array.from(samples.values())
  if (!values.length) {
    throw new Error('Could not read CPU/RAM values from the uploaded pidstat file.')
  }

  const meanCpuPct = round(values.reduce((sum, item) => sum + item.cpu, 0) / values.length)
  const peakCpuPct = round(Math.max(...values.map((item) => item.cpu)))
  const meanRamMb = round(values.reduce((sum, item) => sum + item.rssKb / 1024, 0) / values.length)
  const peakRamMb = round(Math.max(...values.map((item) => item.rssKb / 1024)))

  return { meanCpuPct, peakCpuPct, meanRamMb, peakRamMb }
}

export function formatMs(ms?: number) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return 'N/A'
  return `${round(ms)} ms`
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${round(value)} ${units[idx]}`
}

export function formatDuration(ms: number) {
  if (!ms) return '0 s'
  if (ms < 1000) return `${round(ms)} ms`
  return `${round(ms / 1000)} s`
}

export function formatPct(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A'
  return `${round(value)}%`
}

export function formatResource(value?: number, suffix = '') {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${round(value)}${suffix}`
}

function metricValues(metric?: K6Metric) {
  return metric?.values || {}
}

function firstDefined(...values: Array<number | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return 0
}

function firstDefinedOptional(...values: Array<number | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

function num(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
