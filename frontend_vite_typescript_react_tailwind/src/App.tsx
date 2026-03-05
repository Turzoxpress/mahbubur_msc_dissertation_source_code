import React, { useEffect, useMemo, useState } from 'react'
import BackendSwitcher from './components/BackendSwitcher'
import RequestBuilder from './components/RequestBuilder'
import HistoryTable from './components/HistoryTable'
import LoadTestPanel from './components/LoadTestPanel'
import JsonPanel from './components/JsonPanel'
import { Badge, Button, Card, CardBody, TabButton } from './components/ui'
import type { HttpRun } from './lib/http'
import { BookOpenCheck, Github, LayoutDashboard } from 'lucide-react'

type Tab = 'single' | 'load' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('single')
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('baseUrl') || 'http://localhost:8090')
  const [runs, setRuns] = useState<HttpRun[]>([])
  const [selected, setSelected] = useState<HttpRun | null>(null)

  useEffect(() => {
    localStorage.setItem('baseUrl', baseUrl)
  }, [baseUrl])

  const appendRun = (run: HttpRun) => {
    setRuns((prev) => [run, ...prev].slice(0, 500))
  }

  const appendRuns = (batch: HttpRun[]) => {
    setRuns((prev) => [...batch.slice().reverse(), ...prev].slice(0, 500))
  }

  const loadPresets = useMemo(
    () => [
      { name: 'Ping', method: 'GET' as const, path: '/api/ping' },
      { name: 'Stats', method: 'GET' as const, path: '/api/stats' },
      { name: 'Books list (page 1)', method: 'GET' as const, path: '/api/books?page=1&size=20' },
      { name: 'Books search (q=Book)', method: 'GET' as const, path: '/api/books/search?q=Book&page=1&size=20' },
      { name: 'Loans expanded', method: 'GET' as const, path: '/api/loans/expanded?page=1&size=20' },
      {
        name: 'Checkout (book=1 member=1)',
        method: 'POST' as const,
        path: '/api/loans/checkout',
        body: { book_id: 1, member_id: 1, loan_date: '2026-03-01', due_date: '2026-03-15' },
      },
    ],
    [],
  )

  const clear = () => {
    setRuns([])
    setSelected(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Header />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="space-y-6">
              <BackendSwitcher baseUrl={baseUrl} onChange={setBaseUrl} />

              <Card>
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">Workspace</div>
                      <div className="mt-1 text-sm text-slate-300">Store up to 500 recent calls.</div>
                    </div>
                    <Badge tone="neutral">{runs.length} runs</Badge>
                  </div>
                </div>
                <CardBody>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setTab('single')} className="justify-start">
                      Single
                    </Button>
                    <Button variant="secondary" onClick={() => setTab('load')} className="justify-start">
                      Load
                    </Button>
                    <Button variant="secondary" onClick={() => setTab('history')} className="justify-start">
                      History
                    </Button>
                    <Button variant="danger" onClick={clear} className="justify-start" disabled={!runs.length}>
                      Clear
                    </Button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
                    <div className="font-medium text-white">Professional timing fields</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-slate-200">TTFB</span> — time until headers (approx)
                      </div>
                      <div>
                        <span className="text-slate-200">Download</span> — body read + parse
                      </div>
                      <div>
                        <span className="text-slate-200">Total</span> — end-to-end fetch
                      </div>
                    </div>
                    {/* <div className="mt-3 text-xs text-slate-500">
                      For dissertation tables, use k6 for p95/p99 and include server CPU/RAM.
                    </div> */}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TabButton active={tab === 'single'} onClick={() => setTab('single')}>
                Single request
              </TabButton>
              <TabButton active={tab === 'load'} onClick={() => setTab('load')}>
                Load test
              </TabButton>
              <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
                History
              </TabButton>
            </div>

            {tab === 'single' ? (
              <div className="space-y-6">
                <RequestBuilder
                  baseUrl={baseUrl}
                  onRunComplete={(r) => appendRun(r)}
                  onView={(r) => setSelected(r)}
                />
                {selected ? (
                  <JsonPanel
                    title={`Response • ${selected.name}`}
                    value={{
                      request: {
                        name: selected.name,
                        method: selected.method,
                        url: selected.url,
                        status: selected.status,
                        ok: selected.ok,
                        timings_ms: selected.timings,
                        bytes: selected.bytes,
                        started_at: selected.startedAtIso,
                      },
                      response: selected.response,
                      error: selected.error,
                    }}
                    filename="api-response.json"
                  />
                ) : null}
              </div>
            ) : null}

            {tab === 'load' ? (
              <LoadTestPanel baseUrl={baseUrl} presets={loadPresets} onAppendRuns={appendRuns} />
            ) : null}

            {tab === 'history' ? (
              <HistoryTable runs={runs} onClear={clear} onSelect={(r) => setSelected(r)} />
            ) : null}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500/15 via-slate-900/40 to-emerald-500/10 p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Library API Bench Dashboard</h1>
              <p className="mt-1 text-sm text-slate-200/80">
                {/* Switch backend URL, run endpoints, capture timings, export CSV for your report. */}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* <a
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Local-only dashboard"
          >
            <BookOpenCheck className="h-4 w-4" />
            Local test UI
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            href="https://k6.io/"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" />
            k6 reference
          </a> */}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="mt-10 flex flex-col gap-2 text-center text-xs text-slate-500">
      {/* <div>
        Tip: For fair comparisons, use the same dataset size, same query params, and run Spring + Django on the same machine.
      </div>
      <div>UI timings are best-effort; use k6 for official p95/p99 in your dissertation tables.</div> */}
    </div>
  )
}
