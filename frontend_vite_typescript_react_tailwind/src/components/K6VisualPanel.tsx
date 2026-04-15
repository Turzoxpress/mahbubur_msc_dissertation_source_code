import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, Input, Select, Textarea } from './ui'
import type { K6ImportedRun } from '@/lib/k6'
import { formatBytes, formatDuration, formatMs, parseK6SummaryExport } from '@/lib/k6'
import { Download, FileUp, Import, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'k6-visual-runs'

type ScenarioProfile = {
  key: string
  title: string
  description: string
  scriptPath: string
  suggestedEnv: string[]
}

const SCENARIOS: ScenarioProfile[] = [
  {
    key: 'smoke',
    title: 'Smoke',
    description: 'Ping-only validation run for quick sanity checks before measured workloads.',
    scriptPath: 'testing/k6/smoke.js',
    suggestedEnv: ['VUS=1', 'ITERATIONS=10'],
  },
  {
    key: 'read-heavy',
    title: 'Read-heavy',
    description: 'Books list, books search, loans expanded, and stats. Good for baseline API retrieval.',
    scriptPath: 'testing/k6/read-heavy.js',
    suggestedEnv: ['VUS=20', 'DURATION=30s'],
  },
  {
    key: 'write-heavy',
    title: 'Write-heavy',
    description: 'Creates books/members and updates stock to stress write paths and validation.',
    scriptPath: 'testing/k6/write-heavy.js',
    suggestedEnv: ['VUS=5', 'DURATION=20s'],
  },
  {
    key: 'mixed-workload',
    title: 'Mixed workload',
    description: 'Combines reads, active-loan retrieval, and book creation in one ramping scenario.',
    scriptPath: 'testing/k6/mixed-workload.js',
    suggestedEnv: ['TARGET_VUS=10'],
  },
]

export default function K6VisualPanel(props: { baseUrl: string }) {
  const [framework, setFramework] = useState('Spring Boot')
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key)
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [runs, setRuns] = useState<K6ImportedRun[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as K6ImportedRun[]
      setRuns(parsed)
      if (parsed[0]) setSelectedId(parsed[0].id)
    } catch {
      // ignore invalid local storage
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  }, [runs])

  const selectedScenario = useMemo(
    () => SCENARIOS.find((scenario) => scenario.key === scenarioKey) || SCENARIOS[0],
    [scenarioKey],
  )
  const selectedRun = runs.find((run) => run.id === selectedId) || null

  const exampleCommand = useMemo(() => {
    const envPart = [`BASE_URL=${props.baseUrl}`, ...selectedScenario.suggestedEnv].join(' ')
    const safeFramework = framework.toLowerCase().replace(/\s+/g, '-')
    const safeScenario = selectedScenario.key.replace(/\s+/g, '-')
    return `${envPart} k6 run --summary-export=./results/${safeFramework}-${safeScenario}.json ${selectedScenario.scriptPath}`
  }, [framework, props.baseUrl, selectedScenario])

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    for (const file of files) {
      const text = await file.text()
      importJson(text, file.name)
    }
    event.target.value = ''
  }

  const importJson = (text: string, fileName?: string) => {
    setError(null)
    try {
      const parsed = JSON.parse(text)
      const summary = parseK6SummaryExport(parsed)
      const run: K6ImportedRun = {
        id: crypto.randomUUID(),
        importedAtIso: new Date().toISOString(),
        framework,
        scenario: selectedScenario.title,
        label: label.trim() || `${framework} • ${selectedScenario.title}`,
        baseUrl: props.baseUrl,
        sourceName: fileName || sourceName || 'pasted-summary.json',
        notes: notes.trim() || undefined,
        summary,
        raw: parsed,
      }
      setRuns((prev) => [run, ...prev])
      setSelectedId(run.id)
      setPasteText('')
      setSourceName('')
      setLabel('')
      setNotes('')
    } catch (err: any) {
      setError(err?.message || 'Could not parse the k6 summary export file.')
    }
  }

  const exportNormalizedJson = () => {
    download('k6-normalized-runs.json', JSON.stringify(runs, null, 2), 'application/json;charset=utf-8')
  }

  const exportComparisonCsv = () => {
    const header = [
      'label', 'framework', 'scenario', 'base_url', 'source_name', 'duration_ms', 'total_requests', 'failed_requests', 'error_rate_pct',
      'requests_per_second', 'avg_ms', 'median_ms', 'p95_ms', 'p99_ms', 'min_ms', 'max_ms', 'iterations', 'checks_passed', 'checks_failed', 'check_pass_rate_pct', 'threshold_passed', 'imported_at', 'notes'
    ]
    const rows = runs.map((run) => {
      const passed = run.summary.thresholds.every((threshold) => threshold.passed)
      return [
        csv(run.label),
        csv(run.framework),
        csv(run.scenario),
        csv(run.baseUrl),
        csv(run.sourceName),
        String(run.summary.durationMs),
        String(run.summary.totalRequests),
        String(run.summary.failedRequests),
        String(run.summary.errorRatePct),
        String(run.summary.requestsPerSecond),
        String(run.summary.avgMs),
        String(run.summary.medianMs),
        String(run.summary.p95Ms),
        String(run.summary.p99Ms),
        String(run.summary.minMs),
        String(run.summary.maxMs),
        String(run.summary.iterations),
        String(run.summary.checksPassed),
        String(run.summary.checksFailed),
        String(run.summary.checkPassRatePct),
        String(passed),
        run.importedAtIso,
        csv(run.notes || ''),
      ]
    })
    download('k6-comparison.csv', [header.join(','), ...rows.map((row) => row.join(','))].join('\n'), 'text/csv;charset=utf-8')
  }

  const removeRun = (id: string) => {
    setRuns((prev) => prev.filter((run) => run.id !== id))
    if (selectedId === id) {
      const next = runs.find((run) => run.id !== id)
      setSelectedId(next?.id || null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="k6 visual workspace"
          subtitle="Run k6 from the terminal, export JSON summaries, then import them here for a clean visual comparison."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={exportNormalizedJson} disabled={!runs.length}>
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button variant="secondary" onClick={exportComparisonCsv} disabled={!runs.length}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Framework</div>
                  <Select value={framework} onChange={(e) => setFramework(e.target.value)}>
                    <option>Spring Boot</option>
                    <option>Django REST Framework</option>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Scenario</div>
                  <Select value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)}>
                    {SCENARIOS.map((scenario) => (
                      <option key={scenario.key} value={scenario.key}>{scenario.title}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">{selectedScenario.title}</div>
                <div className="mt-1">{selectedScenario.description}</div>
                <div className="mt-3 text-xs text-slate-500">Suggested terminal command</div>
                <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800">{exampleCommand}</pre>
                <div className="mt-3 text-xs text-slate-500">This frontend does not execute k6 inside the browser. It visualizes the real exported k6 output.</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Run label</div>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Spring • read-heavy • VUS20" />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-slate-600">Source file name (optional)</div>
                  <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="spring-read-heavy-vus20.json" />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Notes (optional)</div>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Warm-up excluded. Same seed dataset. CPU/RAM captured in terminal screenshot." />
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Paste k6 summary-export JSON</div>
                <Textarea rows={8} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='Paste the content from a k6 --summary-export JSON file here.' />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => importJson(pasteText)} disabled={!pasteText.trim()}>
                  <Import className="h-4 w-4" />
                  Import pasted JSON
                </Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                  <FileUp className="h-4 w-4" />
                  Import JSON file
                </Button>
                <input ref={fileRef} className="hidden" type="file" accept="application/json,.json" multiple onChange={handleFileImport} />
              </div>

              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card className="h-full">
            <CardHeader title="Imported k6 runs" subtitle="Select a run to inspect the full metric set." />
            <CardBody>
              <div className="space-y-3">
                {runs.map((run) => {
                  const allThresholdsPassed = run.summary.thresholds.every((threshold) => threshold.passed)
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedId(run.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer ${selectedId === run.id ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{run.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{run.framework} • {run.scenario}</div>
                          <div className="mt-1 text-xs text-slate-500">{run.sourceName}</div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
                          onClick={(e) => { e.stopPropagation(); removeRun(run.id) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={allThresholdsPassed ? 'ok' : 'warn'}>{allThresholdsPassed ? 'Thresholds passed' : 'Threshold review'}</Badge>
                        <Badge tone={run.summary.errorRatePct > 0 ? 'warn' : 'ok'}>{run.summary.errorRatePct}% errors</Badge>
                        <Badge tone="neutral">{run.summary.requestsPerSecond} req/s</Badge>
                      </div>
                    </div>
                  )
                })}
                {!runs.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No k6 runs imported yet.</div> : null}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="xl:col-span-8">
          {selectedRun ? <RunDetails run={selectedRun} /> : <EmptyState />}
        </div>
      </div>

      {runs.length ? <ComparisonTable runs={runs} /> : null}
    </div>
  )
}

function RunDetails(props: { run: K6ImportedRun }) {
  const { run } = props
  const thresholdsPassed = run.summary.thresholds.every((threshold) => threshold.passed)

  return (
    <Card>
      <CardHeader
        title={run.label}
        subtitle={`${run.framework} • ${run.scenario} • imported ${new Date(run.importedAtIso).toLocaleString()}`}
        right={<Badge tone={thresholdsPassed ? 'ok' : 'warn'}>{thresholdsPassed ? 'All thresholds passed' : 'Check thresholds'}</Badge>}
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Avg latency" value={formatMs(run.summary.avgMs)} />
          <Metric label="Median" value={formatMs(run.summary.medianMs)} />
          <Metric label="p95" value={formatMs(run.summary.p95Ms)} />
          <Metric label="p99" value={formatMs(run.summary.p99Ms)} />
          <Metric label="Min" value={formatMs(run.summary.minMs)} />
          <Metric label="Max" value={formatMs(run.summary.maxMs)} />
          <Metric label="Req/s" value={String(run.summary.requestsPerSecond)} />
          <Metric label="Total requests" value={String(run.summary.totalRequests)} />
          <Metric label="Failed requests" value={String(run.summary.failedRequests)} />
          <Metric label="Error rate" value={`${run.summary.errorRatePct}%`} />
          <Metric label="Iterations" value={String(run.summary.iterations)} />
          <Metric label="Duration" value={formatDuration(run.summary.durationMs)} />
          <Metric label="Checks passed" value={String(run.summary.checksPassed)} />
          <Metric label="Checks failed" value={String(run.summary.checksFailed)} />
          <Metric label="Check pass rate" value={`${run.summary.checkPassRatePct}%`} />
          <Metric label="Peak VUs" value={String(run.summary.vusPeak)} />
          <Metric label="Data received" value={formatBytes(run.summary.dataReceivedBytes)} />
          <Metric label="Data sent" value={formatBytes(run.summary.dataSentBytes)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Run metadata</div>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Base URL</dt><dd className="text-right">{run.baseUrl}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Source file</dt><dd className="text-right">{run.sourceName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Scenario</dt><dd className="text-right">{run.scenario}</dd></div>
            </dl>
            {run.notes ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{run.notes}</div> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Threshold results</div>
            <div className="mt-3 space-y-2 text-sm">
              {run.summary.thresholds.length ? run.summary.thresholds.map((threshold) => (
                <div key={`${threshold.metric}-${threshold.rule}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div>
                    <div className="font-medium text-slate-900">{threshold.metric}</div>
                    <div className="text-xs text-slate-500">{threshold.rule}</div>
                  </div>
                  <Badge tone={threshold.passed ? 'ok' : 'warn'}>{threshold.passed ? 'Passed' : 'Failed'}</Badge>
                </div>
              )) : <div className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500">No threshold entries were found in the imported summary.</div>}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function ComparisonTable(props: { runs: K6ImportedRun[] }) {
  return (
    <Card>
      <CardHeader title="k6 comparison table" subtitle="Use this view when filling your dissertation result tables." />
      <CardBody>
        <div className="overflow-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Req/s</th>
                <th className="px-4 py-3">Avg</th>
                <th className="px-4 py-3">Median</th>
                <th className="px-4 py-3">p95</th>
                <th className="px-4 py-3">p99</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Error %</th>
                <th className="px-4 py-3">Thresholds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {props.runs.map((run) => {
                const thresholdsPassed = run.summary.thresholds.every((threshold) => threshold.passed)
                return (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{run.label}</div>
                      <div className="text-xs text-slate-500">{run.framework} • {run.scenario}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.requestsPerSecond}</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.avgMs} ms</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.medianMs} ms</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.p95Ms} ms</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.p99Ms} ms</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.failedRequests}</td>
                    <td className="px-4 py-3 text-slate-700">{run.summary.errorRatePct}%</td>
                    <td className="px-4 py-3"><Badge tone={thresholdsPassed ? 'ok' : 'warn'}>{thresholdsPassed ? 'Passed' : 'Review'}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{props.value}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardBody>
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Import a k6 summary-export JSON file to inspect the visual results here.
        </div>
      </CardBody>
    </Card>
  )
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function csv(v: string) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"'
  }
  return s
}
