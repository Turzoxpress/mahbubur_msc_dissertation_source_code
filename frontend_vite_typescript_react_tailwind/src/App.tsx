import React, { useEffect, useMemo, useState } from 'react'
import BackendSwitcher from './components/BackendSwitcher'
import RequestBuilder from './components/RequestBuilder'
import HistoryTable from './components/HistoryTable'
import LoadTestPanel from './components/LoadTestPanel'
import JsonPanel from './components/JsonPanel'
import K6VisualPanel from './components/K6VisualPanel'
import { Badge, Button, Card, CardBody, TabButton } from './components/ui'
import type { HttpRun } from './lib/http'
import { LayoutDashboard } from 'lucide-react'

type Tab = 'single' | 'load' | 'k6' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('single')
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('baseUrl') || import.meta.env.VITE_DEFAULT_BACKEND_URL || 'http://localhost:8090')
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
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Header />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="space-y-6">
              <BackendSwitcher baseUrl={baseUrl} onChange={setBaseUrl} />

              <Card>
                <div className="border-b border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">Workspace</div>
                      <div className="mt-1 text-sm text-slate-600">Store up to 500 recent browser-side calls and import unlimited k6 summaries.</div>
                    </div>
                    <Badge tone="neutral">{runs.length} browser runs</Badge>
                  </div>
                </div>
                <CardBody>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setTab('single')} className="justify-start">Single</Button>
                    <Button variant="secondary" onClick={() => setTab('load')} className="justify-start">Load</Button>
                    <Button variant="secondary" onClick={() => setTab('k6')} className="justify-start">k6 visual</Button>
                    <Button variant="secondary" onClick={() => setTab('history')} className="justify-start">History</Button>
                    <Button variant="danger" onClick={clear} className="justify-start col-span-2" disabled={!runs.length}>Clear browser history</Button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-medium text-slate-900">How to use both views correctly</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                      <div><span className="text-slate-700">Single / Load</span> — quick frontend-side verification and screenshots.</div>
                      <div><span className="text-slate-700">k6 visual</span> — import real k6 summary-export files and review the full benchmark metrics visually.</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <TabButton active={tab === 'single'} onClick={() => setTab('single')}>Single request</TabButton>
              <TabButton active={tab === 'load'} onClick={() => setTab('load')}>Quick load</TabButton>
              <TabButton active={tab === 'k6'} onClick={() => setTab('k6')}>k6 visual</TabButton>
              <TabButton active={tab === 'history'} onClick={() => setTab('history')}>History</TabButton>
            </div>

            {tab === 'single' ? (
              <div className="space-y-6">
                <RequestBuilder baseUrl={baseUrl} onRunComplete={appendRun} onView={setSelected} />
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

            {tab === 'load' ? <LoadTestPanel baseUrl={baseUrl} presets={loadPresets} onAppendRuns={appendRuns} /> : null}
            {tab === 'k6' ? <K6VisualPanel baseUrl={baseUrl} /> : null}
            {tab === 'history' ? <HistoryTable runs={runs} onClear={clear} onSelect={setSelected} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-100 via-white to-rose-100 p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
            <LayoutDashboard className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Library Management API Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manual API checks, quick browser load tests, and imported k6 benchmark summaries in one clean workspace.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
