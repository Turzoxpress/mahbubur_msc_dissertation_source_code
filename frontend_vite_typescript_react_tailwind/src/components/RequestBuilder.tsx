import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Select, Textarea, Badge } from './ui'
import { SendHorizonal, Wand2 } from 'lucide-react'
import { fetchWithTimings, HttpRun } from '@/lib/http'

export type EndpointPreset = {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
}

export default function RequestBuilder(props: {
  baseUrl: string
  onRunComplete: (run: HttpRun) => void
  onView: (run: HttpRun) => void
}) {
  const presets: EndpointPreset[] = useMemo(
    () => [
      { name: 'Ping', method: 'GET', path: '/api/ping' },
      { name: 'Stats', method: 'GET', path: '/api/stats' },

      { name: 'Books: list', method: 'GET', path: '/api/books?page=1&size=20' },
      { name: 'Books: search', method: 'GET', path: '/api/books/search?q=Book&page=1&size=20' },
      { name: 'Books: available', method: 'GET', path: '/api/books/available?page=1&size=20' },
      { name: 'Books: by ISBN', method: 'GET', path: '/api/books/isbn/ISBN000001' },
      {
        name: 'Books: create',
        method: 'POST',
        path: '/api/books',
        body: {
          isbn: 'ISBN999999',
          title: 'Frontend Created Book',
          author: 'Mahbubur',
          published_year: 2024,
          available_copies: 5,
        },
      },
      {
        name: 'Books: bulk (5)',
        method: 'POST',
        path: '/api/books/bulk',
        body: Array.from({ length: 5 }).map((_, i) => ({
          isbn: `ISBNBULK${String(i + 1).padStart(3, '0')}`,
          title: `Bulk Book ${i + 1}`,
          author: 'Bulk Author',
          published_year: 2022,
          available_copies: 10,
        })),
      },
      { name: 'Books: stock set (id=1)', method: 'PATCH', path: '/api/books/1/stock', body: { available_copies: 25 } },

      { name: 'Members: list', method: 'GET', path: '/api/members?page=1&size=20' },
      { name: 'Members: search', method: 'GET', path: '/api/members/search?q=Member&page=1&size=20' },
      {
        name: 'Members: create',
        method: 'POST',
        path: '/api/members',
        body: {
          membership_no: 'M999999',
          full_name: 'Frontend Member',
          email: 'frontend_member@example.com',
          joined_at: '2026-03-01',
        },
      },

      {
        name: 'Loans: checkout',
        method: 'POST',
        path: '/api/loans/checkout',
        body: {
          book_id: 1,
          member_id: 1,
          loan_date: '2026-03-01',
          due_date: '2026-03-15',
        },
      },
      { name: 'Loans: return (id=1)', method: 'POST', path: '/api/loans/1/return' },
      { name: 'Loans: renew (id=1)', method: 'POST', path: '/api/loans/1/renew', body: { due_date: '2026-03-25' } },
      { name: 'Loans: expanded', method: 'GET', path: '/api/loans/expanded?page=1&size=20' },
      { name: 'Loans: active by member', method: 'GET', path: '/api/loans/active?memberId=1&page=1&size=20' },
      { name: 'Loans: overdue', method: 'GET', path: '/api/loans/overdue?asOf=2026-03-20&page=1&size=20' },
    ],
    [],
  )

  const [presetIdx, setPresetIdx] = useState(0)
  const preset = presets[presetIdx]

  const [method, setMethod] = useState<EndpointPreset['method']>('GET')
  const [path, setPath] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [running, setRunning] = useState(false)
  const [last, setLast] = useState<HttpRun | null>(null)

  useEffect(() => {
    if (!preset) return
    setMethod(preset.method)
    setPath(preset.path)
    setBodyText(preset.body ? JSON.stringify(preset.body, null, 2) : '')
  }, [presetIdx])

  const send = async () => {
    setRunning(true)
    setLast(null)

    let init: RequestInit | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      let json: any = undefined
      if (bodyText.trim().length) {
        try {
          json = JSON.parse(bodyText)
        } catch {
          setRunning(false)
          const r: HttpRun = {
            id: crypto.randomUUID(),
            name: 'Invalid JSON',
            method,
            url: `${props.baseUrl}${path}`,
            ok: false,
            startedAtIso: new Date().toISOString(),
            timings: { ttfbMs: 0, downloadMs: 0, totalMs: 0 },
            error: 'Request body is not valid JSON.',
          }
          setLast(r)
          props.onRunComplete(r)
          props.onView(r)
          return
        }
      }

      init = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json !== undefined ? JSON.stringify(json) : undefined,
      }
    } else {
      init = { method }
    }

    const run = await fetchWithTimings({
      baseUrl: props.baseUrl,
      path,
      name: preset?.name || 'Custom Request',
      init,
      expectJson: true,
    })

    setRunning(false)
    setLast(run)
    props.onRunComplete(run)
    props.onView(run)
  }

  const tone = !last ? 'neutral' : last.ok ? 'ok' : 'bad'

  return (
    <Card>
      <CardHeader
        title="Single request"
        // subtitle="Run one endpoint and capture response + timings (TTFB / download / total)."
        subtitle=''
        right={
          <Button onClick={send} disabled={running}>
            <SendHorizonal className="h-4 w-4" />
            {running ? 'Sending…' : 'Send'}
          </Button>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-300">Preset</div>
              <Select value={String(presetIdx)} onChange={(e) => setPresetIdx(parseInt(e.target.value, 10))}>
                {presets.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.method} — {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">Method</div>
                <Select value={method} onChange={(e) => setMethod(e.target.value as any)}>
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-slate-300">Path</div>
                <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/api/ping" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">Body (JSON)</div>
                <Button
                  variant="ghost"
                  onClick={() => setBodyText(preset?.body ? JSON.stringify(preset.body, null, 2) : '')}
                  title="Reset body from preset"
                >
                  <Wand2 className="h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Textarea
                rows={10}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="{}"
              />
              <div className="mt-2 text-xs text-slate-500">
                Tip: For POST/PUT/PATCH, body must be valid JSON.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone as any}>{last ? (last.ok ? 'OK' : 'Failed') : 'Ready'}</Badge>
                {last?.status !== undefined ? <Badge tone="neutral">HTTP {last.status}</Badge> : null}
                {last?.bytes !== undefined ? <Badge tone="neutral">{last.bytes} bytes</Badge> : null}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric label="TTFB" value={last ? `${last.timings.ttfbMs} ms` : '—'} />
                <Metric label="Download" value={last ? `${last.timings.downloadMs} ms` : '—'} />
                <Metric label="Total" value={last ? `${last.timings.totalMs} ms` : '—'} />
              </div>

              <div className="mt-3 text-xs text-slate-400">
                *TTFB is approximate (time until fetch resolves with headers). For official benchmarks, use k6.
              </div>

              {last?.error ? (
                <div className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {last.error}
                </div>
              ) : null}

              {last ? (
                <div className="mt-3 text-xs text-slate-500">
                  {new Date(last.startedAtIso).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="text-sm text-slate-300">
              {/* <div className="mb-1 font-medium text-white">Notes for your report</div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>Record p95/p99 using k6; use this page for quick verification & screenshots.</li>
                <li>Keep the same dataset size and same endpoint parameters across both backends.</li>
                <li>Run the frontend from the same machine for consistent client-side timing.</li>
              </ul> */}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs text-slate-400">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{props.value}</div>
    </div>
  )
}
