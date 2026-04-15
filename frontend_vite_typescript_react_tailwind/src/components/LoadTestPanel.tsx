import React, { useRef, useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Select, Badge } from './ui'
import { Activity, Download, Square } from 'lucide-react'
import { fetchWithTimings, HttpRun } from '@/lib/http'
import { summarizeDurations, Summary } from '@/lib/stats'

export type LoadPreset = {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
}

export default function LoadTestPanel(props: {
  baseUrl: string
  presets: LoadPreset[]
  onAppendRuns: (runs: HttpRun[]) => void
}) {
  const [presetIdx, setPresetIdx] = useState(0)
  const preset = props.presets[presetIdx]

  const [requests, setRequests] = useState(50)
  const [concurrency, setConcurrency] = useState(10)
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [runs, setRuns] = useState<HttpRun[]>([])
  const stopRef = useRef(false)

  const canBody = preset.method !== 'GET' && preset.method !== 'DELETE'

  const runLoad = async () => {
    setRunning(true)
    stopRef.current = false
    setSummary(null)
    setRuns([])

    const start = performance.now()

    const initFactory = (): RequestInit | undefined => {
      if (!canBody) return { method: preset.method }
      return {
        method: preset.method,
        headers: { 'Content-Type': 'application/json' },
        body: preset.body !== undefined ? JSON.stringify(preset.body) : undefined,
      }
    }

    const results: HttpRun[] = []
    let okCount = 0

    const pool = new Set<Promise<void>>()
    let i = 0

    const launchOne = async () => {
      const run = await fetchWithTimings({
        baseUrl: props.baseUrl,
        path: preset.path,
        name: `Load: ${preset.name}`,
        init: initFactory(),
        expectJson: true,
      })
      if (run.ok) okCount += 1
      results.push(run)
      if (results.length % 5 === 0) setRuns([...results])
    }

    while (i < requests && !stopRef.current) {
      while (pool.size < concurrency && i < requests && !stopRef.current) {
        i += 1
        const p = launchOne().finally(() => pool.delete(p))
        pool.add(p)
      }
      if (pool.size) await Promise.race(pool)
    }

    await Promise.allSettled(Array.from(pool))

    const end = performance.now()
    const totalSeconds = (end - start) / 1000

    setRuns(results)
    props.onAppendRuns(results)

    const durations = results.map((r) => r.timings.totalMs)
    setSummary(summarizeDurations(durations, okCount, totalSeconds))
    setRunning(false)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ preset, summary, runs }, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'browser-load-test.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCsv = () => {
    const header = ['timestamp', 'method', 'name', 'url', 'status', 'ok', 'ttfb_ms', 'download_ms', 'total_ms', 'bytes', 'error']
    const rows = runs.map((r) => [
      r.startedAtIso,
      r.method,
      csv(r.name),
      csv(r.url),
      String(r.status ?? ''),
      String(r.ok),
      String(r.timings.ttfbMs),
      String(r.timings.downloadMs),
      String(r.timings.totalMs),
      String(r.bytes ?? ''),
      csv(r.error ?? ''),
    ])
    const text = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'browser-load-test-runs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader
        title="Quick browser load test"
        subtitle="Useful for fast frontend-side comparisons and screenshots. Use the k6 visual tab for official dissertation metrics."
        right={
          <div className="flex items-center gap-2">
            {running ? (
              <Button variant="danger" onClick={() => (stopRef.current = true)}>
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button onClick={runLoad}>
                <Activity className="h-4 w-4" />
                Run
              </Button>
            )}
            <Button variant="secondary" onClick={exportJson} disabled={!runs.length}>
              <Download className="h-4 w-4" /> JSON
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={!runs.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">Endpoint</div>
              <Select value={String(presetIdx)} onChange={(e) => setPresetIdx(parseInt(e.target.value, 10))}>
                {props.presets.map((p, idx) => (
                  <option key={p.name} value={idx}>{p.method} — {p.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Requests</div>
                <Input type="number" min={1} max={2000} value={requests} onChange={(e) => setRequests(parseInt(e.target.value || '0', 10) || 1)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Concurrency</div>
                <Input type="number" min={1} max={200} value={concurrency} onChange={(e) => setConcurrency(parseInt(e.target.value || '0', 10) || 1)} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">Use this for</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Quick “does it feel faster?” checks</li>
                <li>Browser-side evidence and screenshots</li>
                <li>Finding obvious slow endpoints before k6</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Count" value={summary ? String(summary.count) : '—'} />
              <Metric label="Req/s" value={summary ? String(summary.rps) : '—'} />
              <Metric label="Failed" value={summary ? String(summary.failed) : '—'} />
              <Metric label="Error rate" value={summary ? `${summary.errorRate}%` : '—'} />
              <Metric label="Avg" value={summary ? `${summary.avgMs} ms` : '—'} />
              <Metric label="Median" value={summary ? `${summary.p50Ms} ms` : '—'} />
              <Metric label="p95" value={summary ? `${summary.p95Ms} ms` : '—'} />
              <Metric label="p99" value={summary ? `${summary.p99Ms} ms` : '—'} />
              <Metric label="Min" value={summary ? `${summary.minMs} ms` : '—'} />
              <Metric label="Max" value={summary ? `${summary.maxMs} ms` : '—'} />
            </div>

            <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">TTFB</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.slice(0, 100).map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{idx + 1}</td>
                      <td className="px-4 py-3"><Badge tone={r.ok ? 'ok' : 'bad'}>{r.status ?? (r.ok ? 'OK' : 'ERR')}</Badge></td>
                      <td className="px-4 py-3 text-slate-700">{r.timings.ttfbMs} ms</td>
                      <td className="px-4 py-3 text-slate-700">{r.timings.totalMs} ms</td>
                      <td className="px-4 py-3 text-slate-700">{r.bytes ?? '—'}</td>
                    </tr>
                  ))}
                  {!runs.length ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>Run a browser load test to see results.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {runs.length > 100 ? <div className="mt-2 text-xs text-slate-500">Showing first 100 requests. Export CSV for full detail.</div> : null}
          </div>
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

function csv(v: string) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"'
  }
  return s
}
