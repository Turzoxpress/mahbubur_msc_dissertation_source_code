import React, { useMemo, useRef, useState } from 'react'
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
      // keep UI responsive
      if (results.length % 5 === 0) setRuns([...results])
    }

    while (i < requests && !stopRef.current) {
      while (pool.size < concurrency && i < requests && !stopRef.current) {
        i += 1
        const p = launchOne().finally(() => pool.delete(p))
        pool.add(p)
      }
      // wait for at least one to finish
      if (pool.size) {
        await Promise.race(pool)
      }
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
    a.download = 'load-test.json'
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
    a.download = 'load-test-runs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader
        title="Load test (quick client-side)"
        subtitle="Runs many requests from your browser. For dissertation-grade results, use k6 — but this is great for quick comparisons and screenshots."
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
              <Download className="h-4 w-4" />
              JSON
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={!runs.length}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-300">Endpoint</div>
              <Select value={String(presetIdx)} onChange={(e) => setPresetIdx(parseInt(e.target.value, 10))}>
                {props.presets.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.method} — {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">Requests</div>
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  value={requests}
                  onChange={(e) => setRequests(parseInt(e.target.value || '0', 10) || 1)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">Concurrency</div>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value || '0', 10) || 1)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              <div className="text-white font-medium">What this is good for</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Fast “does it feel faster?” comparison</li>
                <li>Quick screenshots for your appendix</li>
                <li>Finding obvious slow endpoints before k6</li>
              </ul>
              <div className="mt-3 text-xs text-slate-500">
                Browser load tests include client overhead and aren’t a substitute for k6.
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Count" value={summary ? String(summary.count) : '—'} />
              <Metric label="RPS" value={summary ? String(summary.rps) : '—'} />
              <Metric label="Error rate" value={summary ? `${Math.round(summary.errorRate * 10000) / 100}%` : '—'} />
              <Metric label="Avg" value={summary ? `${summary.avgMs} ms` : '—'} />
              <Metric label="p95" value={summary ? `${summary.p95Ms} ms` : '—'} />
              <Metric label="p99" value={summary ? `${summary.p99Ms} ms` : '—'} />
            </div>

            <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">TTFB</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {runs.slice(0, 100).map((r, idx) => (
                    <tr key={r.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-300">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Badge tone={r.ok ? 'ok' : 'bad'}>{r.status ?? (r.ok ? 'OK' : 'ERR')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{r.timings.ttfbMs} ms</td>
                      <td className="px-4 py-3 text-slate-200">{r.timings.totalMs} ms</td>
                      <td className="px-4 py-3 text-slate-200">{r.bytes ?? '—'}</td>
                    </tr>
                  ))}
                  {!runs.length ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={5}>
                        Run a load test to see results.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {runs.length > 100 ? (
              <div className="mt-2 text-xs text-slate-500">Showing first 100 requests. Export CSV for full detail.</div>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className="text-xs text-slate-400">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{props.value}</div>
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
