export type K6Threshold = {
  metric: string
  rule: string
  passed: boolean
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
  p99Ms: number
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
  baseUrl: string
  sourceName: string
  notes?: string
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
    p99Ms: round(firstDefined(httpReqDuration['p(99)'], httpReqDuration.p99)),
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

export function formatMs(ms: number) {
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

function metricValues(metric?: K6Metric) {
  return metric?.values || {}
}

function firstDefined(...values: Array<number | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return 0
}

function num(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
