import React, { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Badge } from './ui'
import { Download, Trash2, Eye } from 'lucide-react'
import type { HttpRun } from '@/lib/http'

export default function HistoryTable(props: {
  runs: HttpRun[]
  onClear: () => void
  onSelect: (run: HttpRun) => void
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return props.runs
    return props.runs.filter((r) => {
      return (
        r.name.toLowerCase().includes(t) ||
        r.method.toLowerCase().includes(t) ||
        r.url.toLowerCase().includes(t) ||
        String(r.status ?? '').includes(t)
      )
    })
  }, [q, props.runs])

  const exportCsv = () => {
    const header = [
      'timestamp',
      'name',
      'method',
      'url',
      'status',
      'ok',
      'ttfb_ms',
      'download_ms',
      'total_ms',
      'bytes',
      'error',
    ]

    const rows = filtered.map((r) => [
      r.startedAtIso,
      csv(r.name),
      r.method,
      csv(r.url),
      String(r.status ?? ''),
      String(r.ok),
      String(r.timings.ttfbMs),
      String(r.timings.downloadMs),
      String(r.timings.totalMs),
      String(r.bytes ?? ''),
      csv(r.error ?? ''),
    ])

    const csvText = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'api-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader
        title="History"
        subtitle="Every request you run is stored here. Export CSV for your tables."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="danger" onClick={props.onClear} disabled={!props.runs.length}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="mb-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by endpoint, URL, status…" />
        </div>

        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">TTFB</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(r.startedAtIso).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{r.method}</Badge>
                      <div className="font-medium text-white">{r.name}</div>
                      <div className="truncate text-xs text-slate-400">{r.url}</div>
                    </div>
                    {r.error ? <div className="mt-1 text-xs text-rose-200">{r.error}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.ok ? 'ok' : 'bad'}>{r.status ?? (r.ok ? 'OK' : 'ERR')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{r.timings.ttfbMs} ms</td>
                  <td className="px-4 py-3 text-slate-200">{r.timings.totalMs} ms</td>
                  <td className="px-4 py-3 text-slate-200">{r.bytes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => props.onSelect(r)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={7}>
                    No results.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

function csv(v: string) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replaceAll('"', '""') + '"'
  }
  return s
}
