import React, { useMemo, useRef, useState } from 'react'
import { Activity, BarChart3, Cpu, FileUp, PieChart, Sparkles, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, cx } from './ui'

type Scenario = 'Smoke' | 'Read-heavy' | 'Unknown'
type RunKind = 'Measured' | 'Warm-up' | 'Unknown'
type Framework = 'Spring Boot' | 'Django/DRF' | 'Unknown'
type Mode = 'test' | 'cpu'

type SummaryMetrics = {
  avgMs?: number
  medianMs?: number
  p95Ms?: number
  p99Ms?: number
  minMs?: number
  maxMs?: number
  requestsPerSecond?: number
  totalRequests?: number
  failedRequests?: number
  errorRatePct?: number
  iterations?: number
  thresholdPassed?: boolean
}

type ResourceMetrics = {
  meanCpuPct?: number
  peakCpuPct?: number
  meanRamMb?: number
  peakRamMb?: number
}

type UploadRecord = {
  id: string
  sourceName: string
  framework: Framework
  scenario: Scenario
  runKind: RunKind
  runCode: string
  vuLevel?: number
  summary?: SummaryMetrics
  resources?: ResourceMetrics
}

export default function K6VisualPanel() {
  const summaryRef = useRef<HTMLInputElement | null>(null)
  const resourceRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<Mode>('test')
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = records.find((r) => r.id === selectedId) || records[0] || null

  const comparisonGroups = useMemo(() => {
    const measured = records.filter((r) => r.runKind === 'Measured')
    const grouped = new Map<string, UploadRecord[]>()
    for (const record of measured) {
      const key = `${record.scenario}::${record.framework}`
      grouped.set(key, [...(grouped.get(key) || []), record])
    }
    return Array.from(grouped.entries()).map(([key, list]) => {
      const [scenario, framework] = key.split('::') as [Scenario, Framework]
      return {
        scenario,
        framework,
        avgMs: mean(list.map((r) => r.summary?.avgMs)),
        p95Ms: mean(list.map((r) => r.summary?.p95Ms)),
        reqPerSec: mean(list.map((r) => r.summary?.requestsPerSecond)),
        errorPct: mean(list.map((r) => r.summary?.errorRatePct)),
        meanCpuPct: mean(list.map((r) => r.resources?.meanCpuPct)),
        meanRamMb: mean(list.map((r) => r.resources?.meanRamMb)),
        count: list.length,
      }
    })
  }, [records])

  const smokeComparison = comparisonGroups.filter((g) => g.scenario === 'Smoke')
  const readComparison = comparisonGroups.filter((g) => g.scenario === 'Read-heavy')

  async function importSummaryFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const next: UploadRecord[] = []
    for (const file of Array.from(files)) {
      try {
        const raw = JSON.parse(await file.text())
        const summary = parseK6Summary(raw)
        const meta = detectFromName(file.name)
        next.push({
          id: crypto.randomUUID(),
          sourceName: file.name,
          framework: meta.framework,
          scenario: meta.scenario,
          runKind: meta.runKind,
          runCode: meta.runCode,
          vuLevel: meta.vuLevel,
          summary,
        })
      } catch (err: any) {
        setError(`Could not read ${file.name}: ${err?.message || 'Unknown error'}`)
      }
    }
    if (next.length) {
      setRecords((prev) => mergeRecords(prev, next))
      setSelectedId(next[0].id)
    }
  }

  async function importResourceFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const next: UploadRecord[] = []
    for (const file of Array.from(files)) {
      try {
        const metrics = parsePidstat(await file.text())
        const meta = detectFromName(file.name)
        next.push({
          id: crypto.randomUUID(),
          sourceName: file.name,
          framework: meta.framework,
          scenario: meta.scenario,
          runKind: meta.runKind,
          runCode: meta.runCode,
          vuLevel: meta.vuLevel,
          resources: metrics,
        })
      } catch (err: any) {
        setError(`Could not read ${file.name}: ${err?.message || 'Unknown error'}`)
      }
    }
    if (next.length) {
      setRecords((prev) => mergeRecords(prev, next))
      setSelectedId((id) => id || next[0].id)
    }
  }

  function clearAll() {
    setRecords([])
    setSelectedId(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="k6 upload" subtitle="Choose the report type, upload the required file, and the frontend will detect the framework, scenario, run type, and VU level from the file name automatically." />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ModeCard
              active={mode === 'test'}
              title="Test summary"
              body="Upload one or more k6 summary JSON files. The frontend will show latency, throughput, error rate, and comparison charts."
              icon={<BarChart3 className="h-5 w-5" />}
              onClick={() => setMode('test')}
            />
            <ModeCard
              active={mode === 'cpu'}
              title="CPU summary"
              body="Upload one or more pidstat text files. The frontend will show CPU and RAM charts and summary cards."
              icon={<Cpu className="h-5 w-5" />}
              onClick={() => setMode('cpu')}
            />
          </div>

          <input ref={summaryRef} type="file" accept=".json,application/json" className="hidden" multiple onChange={(e) => importSummaryFiles(e.target.files)} />
          <input ref={resourceRef} type="file" accept=".txt,text/plain" className="hidden" multiple onChange={(e) => importResourceFiles(e.target.files)} />

          {mode === 'test' ? (
            <ActionCard
              title="Upload k6 summary JSON"
              description="Upload files like EV-K6-SB-SMOKE-VU1-M1-summary.json or EV-K6-DJ-READ-VU20-M3-summary.json"
              help="Use the measured files for screenshots. Warm-up files can be uploaded too, but they are not used in the comparison averages."
              buttonText="Choose JSON files"
              onClick={() => summaryRef.current?.click()}
            />
          ) : (
            <ActionCard
              title="Upload pidstat CPU/RAM file"
              description="Upload files like EV-RES-SB-SMOKE-VU1-M1-pidstat.txt or EV-RES-DJ-READ-VU20-M3-pidstat.txt"
              help="The frontend aggregates all matching processes in the file and calculates mean CPU, peak CPU, mean RAM, and peak RAM."
              buttonText="Choose CPU/RAM files"
              onClick={() => resourceRef.current?.click()}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => summaryRef.current?.click()}><FileUp className="h-4 w-4" />Add test JSON</Button>
            <Button variant="secondary" onClick={() => resourceRef.current?.click()}><Cpu className="h-4 w-4" />Add CPU/RAM file</Button>
            <Button variant="danger" onClick={clearAll} disabled={!records.length}><Trash2 className="h-4 w-4" />Clear all</Button>
          </div>

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        </CardBody>
      </Card>

      {selected ? (
        <Card>
          <CardHeader title="Selected upload" subtitle="Upload a file and the graphs below update automatically." right={<Badge tone="ok">{selected.runKind}</Badge>} />
          <CardBody className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Info label="Framework" value={selected.framework} />
              <Info label="Scenario" value={selected.scenario} />
              <Info label="Run type" value={selected.runKind} />
              <Info label="Run label" value={`${selected.framework.includes('Spring') ? 'Spring' : selected.framework.includes('Django') ? 'Django' : 'Imported'} • ${selected.scenario} • VU${selected.vuLevel ?? '?'} • ${selected.runCode}`} />
              <Info label="VU level used" value={selected.vuLevel != null ? String(selected.vuLevel) : 'N/A'} />
              <Info label="Source file" value={selected.sourceName} />
            </div>

            {selected.summary ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Average latency" value={formatMs(selected.summary.avgMs)} icon={<Activity className="h-4 w-4" />} />
                  <MetricCard title="Median latency" value={formatMs(selected.summary.medianMs)} icon={<Activity className="h-4 w-4" />} />
                  <MetricCard title="p95 latency" value={formatMs(selected.summary.p95Ms)} icon={<Activity className="h-4 w-4" />} />
                  <MetricCard title="p99 latency" value={formatMs(selected.summary.p99Ms)} icon={<Activity className="h-4 w-4" />} />
                  <MetricCard title="Requests / second" value={formatNumber(selected.summary.requestsPerSecond)} icon={<BarChart3 className="h-4 w-4" />} />
                  <MetricCard title="Total requests" value={String(selected.summary.totalRequests ?? 'N/A')} icon={<BarChart3 className="h-4 w-4" />} />
                  <MetricCard title="Failed requests" value={String(selected.summary.failedRequests ?? 'N/A')} icon={<BarChart3 className="h-4 w-4" />} />
                  <MetricCard title="Error rate" value={formatPct(selected.summary.errorRatePct)} icon={<PieChart className="h-4 w-4" />} />
                </div>

                <div className="space-y-5">
                  <ChartCard title="Latency bars">
                    <SmartBarChart
                      items={[
                        { label: 'Avg', value: selected.summary.avgMs ?? 0, color: 'bg-sky-500' },
                        { label: 'Median', value: selected.summary.medianMs ?? 0, color: 'bg-indigo-500' },
                        { label: 'p95', value: selected.summary.p95Ms ?? 0, color: 'bg-fuchsia-500' },
                        { label: 'Max', value: selected.summary.maxMs ?? 0, color: 'bg-rose-500' },
                      ]}
                      formatter={(value) => formatMs(value)}
                    />
                  </ChartCard>
                  <ChartCard title="Latency line">
                    <LineChart
                      items={[
                        { label: 'Min', value: selected.summary.minMs ?? 0 },
                        { label: 'Median', value: selected.summary.medianMs ?? 0 },
                        { label: 'Avg', value: selected.summary.avgMs ?? 0 },
                        { label: 'p95', value: selected.summary.p95Ms ?? 0 },
                        { label: 'Max', value: selected.summary.maxMs ?? 0 },
                      ]}
                      formatter={(value) => formatMs(value)}
                    />
                  </ChartCard>
                  <ChartCard title="Request outcome pie">
                    <PieSummary
                      ok={Math.max((selected.summary.totalRequests || 0) - (selected.summary.failedRequests || 0), 0)}
                      failed={selected.summary.failedRequests || 0}
                    />
                  </ChartCard>
                </div>
              </>
            ) : null}

            {selected.resources ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Mean CPU" value={formatNumber(selected.resources.meanCpuPct, '%')} icon={<Cpu className="h-4 w-4" />} />
                  <MetricCard title="Peak CPU" value={formatNumber(selected.resources.peakCpuPct, '%')} icon={<Cpu className="h-4 w-4" />} />
                  <MetricCard title="Mean RAM" value={formatNumber(selected.resources.meanRamMb, ' MB')} icon={<Cpu className="h-4 w-4" />} />
                  <MetricCard title="Peak RAM" value={formatNumber(selected.resources.peakRamMb, ' MB')} icon={<Cpu className="h-4 w-4" />} />
                </div>

                <div className="space-y-5">
                  <ChartCard title="CPU bars">
                    <SmartBarChart
                      items={[
                        { label: 'Mean CPU', value: selected.resources.meanCpuPct ?? 0, color: 'bg-emerald-500' },
                        { label: 'Peak CPU', value: selected.resources.peakCpuPct ?? 0, color: 'bg-amber-500' },
                      ]}
                      formatter={(value) => formatNumber(value, '%')}
                    />
                  </ChartCard>
                  <ChartCard title="RAM bars">
                    <SmartBarChart
                      items={[
                        { label: 'Mean RAM', value: selected.resources.meanRamMb ?? 0, color: 'bg-sky-500' },
                        { label: 'Peak RAM', value: selected.resources.peakRamMb ?? 0, color: 'bg-indigo-500' },
                      ]}
                      formatter={(value) => formatNumber(value, ' MB')}
                    />
                  </ChartCard>
                  <ChartCard title="CPU headroom pie">
                    <PieSummary ok={Math.max(100 - (selected.resources.meanCpuPct || 0), 0)} failed={Math.min(selected.resources.meanCpuPct || 0, 100)} labels={{ ok: 'Headroom', failed: 'CPU used' }} />
                  </ChartCard>
                </div>
              </>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {records.length ? (
        <Card>
          <CardHeader title="Uploaded files" subtitle="Click any item to switch the focused graphs and statistics." />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedId(record.id)}
                  className={cx(
                    'rounded-2xl border p-4 text-left transition',
                    record.id === selectedId ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">{record.framework} • {record.scenario}</div>
                    <Badge tone={record.runKind === 'Measured' ? 'ok' : 'neutral'}>{record.runCode}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 break-words">{record.sourceName}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>VU: <span className="font-medium text-slate-900">{record.vuLevel ?? 'N/A'}</span></div>
                    <div>Avg: <span className="font-medium text-slate-900">{formatMs(record.summary?.avgMs)}</span></div>
                    <div>Req/s: <span className="font-medium text-slate-900">{formatNumber(record.summary?.requestsPerSecond)}</span></div>
                    <div>CPU: <span className="font-medium text-slate-900">{formatNumber(record.resources?.meanCpuPct, '%')}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      {smokeComparison.length ? <ComparisonSection title="Smoke comparison" rows={smokeComparison} /> : null}
      {readComparison.length ? <ComparisonSection title="Read-heavy comparison" rows={readComparison} /> : null}
    </div>
  )
}

function ComparisonSection(props: { title: string; rows: Array<{ scenario: Scenario; framework: Framework; avgMs?: number; p95Ms?: number; reqPerSec?: number; errorPct?: number; meanCpuPct?: number; meanRamMb?: number; count: number }> }) {
  return (
    <Card>
      <CardHeader title={props.title} subtitle="Average of measured uploads only." />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {props.rows.map((row) => (
            <div key={`${row.scenario}-${row.framework}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-900">{row.framework}</div>
                  <div className="text-sm text-slate-600">{row.count} measured file(s)</div>
                </div>
                <Badge tone="ok">Measured</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="Avg" value={formatMs(row.avgMs)} />
                <MiniStat label="p95" value={formatMs(row.p95Ms)} />
                <MiniStat label="Req/s" value={formatNumber(row.reqPerSec)} />
                <MiniStat label="Error" value={formatPct(row.errorPct)} />
                <MiniStat label="CPU" value={formatNumber(row.meanCpuPct, '%')} />
                <MiniStat label="RAM" value={formatNumber(row.meanRamMb, ' MB')} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <ChartCard title="Latency bars">
            <SmartBarChart
              items={props.rows.map((row) => ({ label: row.framework, value: row.avgMs ?? 0, color: row.framework.includes('Spring') ? 'bg-sky-500' : 'bg-rose-500' }))}
              formatter={(value) => formatMs(value)}
            />
          </ChartCard>
          <ChartCard title="Throughput bars">
            <SmartBarChart
              items={props.rows.map((row) => ({ label: row.framework, value: row.reqPerSec ?? 0, color: row.framework.includes('Spring') ? 'bg-emerald-500' : 'bg-fuchsia-500' }))}
              formatter={(value) => formatNumber(value)}
            />
          </ChartCard>
          <ChartCard title="Performance pie">
            <PieSummary
              ok={props.rows[0]?.reqPerSec || 0}
              failed={props.rows[1]?.reqPerSec || 0}
              labels={{ ok: props.rows[0]?.framework || 'First', failed: props.rows[1]?.framework || 'Second' }}
            />
          </ChartCard>
        </div>
      </CardBody>
    </Card>
  )
}

function ModeCard(props: { active: boolean; title: string; body: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={props.onClick} className={cx('rounded-3xl border p-5 text-left transition', props.active ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{props.icon}</div>
        <div>
          <div className="font-medium text-slate-900">{props.title}</div>
          <div className="mt-1 text-sm text-slate-600">{props.body}</div>
        </div>
      </div>
    </button>
  )
}

function ActionCard(props: { title: string; description: string; help: string; buttonText: string; onClick: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5">
      <div className="font-medium text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-600">{props.description}</div>
      <div className="mt-2 text-xs text-slate-500">{props.help}</div>
      <Button className="mt-4" onClick={props.onClick}>{props.buttonText}</Button>
    </div>
  )
}

function Info(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{props.label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{props.value}</div>
    </div>
  )
}

function MetricCard(props: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-600">{props.icon}<span>{props.title}</span></div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{props.value}</div>
    </div>
  )
}

function ChartCard(props: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-sm font-semibold text-slate-900">{props.title}</div>
      {props.children}
    </div>
  )
}

function SmartBarChart(props: { items: Array<{ label: string; value: number; color: string }>; formatter: (value: number) => string }) {
  const values = props.items.map((item) => item.value).filter((value) => Number.isFinite(value))
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const range = Math.max(max - min, 1)
  return (
    <div className="space-y-3">
      {props.items.map((item) => {
        const normalized = ((item.value - min) / range) * 75 + 20
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-700">{item.label}</span>
              <span className="font-medium text-slate-900">{props.formatter(item.value)}</span>
            </div>
            <div className="h-5 rounded-full bg-slate-100">
              <div className={cx('h-5 rounded-full transition-all duration-500', item.color)} style={{ width: `${Math.max(normalized, 12)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LineChart(props: { items: Array<{ label: string; value: number }>; formatter: (value: number) => string }) {
  const values = props.items.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const chartWidth = 360
  const chartHeight = 180
  const xPadding = 24
  const usableWidth = chartWidth - xPadding * 2
  const usableHeight = 120
  const points = props.items.map((item, index) => {
    const x = props.items.length === 1 ? chartWidth / 2 : xPadding + (index / (props.items.length - 1)) * usableWidth
    const y = 150 - (((item.value - min) / range) * usableHeight + 10)
    return { ...item, x, y }
  })
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  return (
    <div>
      <svg viewBox="0 0 360 180" className="w-full overflow-visible rounded-2xl bg-slate-50 p-3">
        <path d={`M 0 160 H 360`} stroke="#cbd5e1" strokeWidth="1" fill="none" />
        <polyline points={polyline} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#0ea5e9" />
          </g>
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
        {points.map((point) => (
          <div key={point.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="uppercase tracking-wide text-slate-500">{point.label}</div>
            <div className="mt-1 font-medium text-slate-900">{props.formatter(point.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieSummary(props: { ok: number; failed: number; labels?: { ok: string; failed: string } }) {
  const total = Math.max(props.ok + props.failed, 1)
  const okAngle = (props.ok / total) * 360
  const style = { background: `conic-gradient(#10b981 0deg ${okAngle}deg, #f43f5e ${okAngle}deg 360deg)` }
  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
      <div className="relative h-40 w-40 rounded-full" style={style}>
        <div className="absolute inset-7 rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="text-xl font-semibold text-slate-900">{round((props.ok / total) * 100)}%</div>
            <div className="text-xs text-slate-500">{props.labels?.ok || 'Success share'}</div>
          </div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-2 text-sm">
        <LegendRow label={props.labels?.ok || 'OK / success'} value={props.ok} color="bg-emerald-500" />
        <LegendRow label={props.labels?.failed || 'Failed / compared'} value={props.failed} color="bg-rose-500" />
      </div>
    </div>
  )
}

function LegendRow(props: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2"><span className={cx('h-3 w-3 rounded-full', props.color)} /><span className="text-slate-700">{props.label}</span></div>
      <span className="font-medium text-slate-900">{round(props.value)}</span>
    </div>
  )
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{props.label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{props.value}</div>
    </div>
  )
}

function mergeRecords(prev: UploadRecord[], next: UploadRecord[]) {
  const merged = [...prev]
  for (const incoming of next) {
    const idx = merged.findIndex((item) => sameRecord(item, incoming))
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        sourceName: incoming.sourceName.endsWith('.json') ? incoming.sourceName : merged[idx].sourceName,
        summary: incoming.summary ?? merged[idx].summary,
        resources: incoming.resources ?? merged[idx].resources,
      }
    } else {
      merged.unshift(incoming)
    }
  }
  return merged
}

function sameRecord(a: UploadRecord, b: UploadRecord) {
  return a.framework === b.framework && a.scenario === b.scenario && a.runKind === b.runKind && a.vuLevel === b.vuLevel && a.runCode === b.runCode
}

function parseK6Summary(raw: any): SummaryMetrics {
  const metrics = raw?.metrics || {}
  const durationValues = metrics.http_req_duration || metrics['http_req_duration{expected_response:true}'] || {}
  const requests = metrics.http_reqs || {}
  const failed = metrics.http_req_failed || {}
  const iterations = metrics.iterations || {}
  const totalRequests = pick(requests, ['count'])
  const failedRate = pick(failed, ['value', 'rate'])
  const checksPasses = pick(metrics.checks || {}, ['passes'])
  const checksFails = pick(metrics.checks || {}, ['fails'])
  const thresholdPassed = extractThresholdPass(metrics)
  return {
    avgMs: pick(durationValues, ['avg', 'average']),
    medianMs: pick(durationValues, ['med', 'median', 'p(50)']),
    p95Ms: pick(durationValues, ['p(95)', 'p95']),
    p99Ms: pick(durationValues, ['p(99)', 'p99']),
    minMs: pick(durationValues, ['min']),
    maxMs: pick(durationValues, ['max']),
    requestsPerSecond: pick(requests, ['rate']),
    totalRequests,
    failedRequests: typeof totalRequests === 'number' ? Math.round((failedRate || 0) * totalRequests) : undefined,
    errorRatePct: typeof failedRate === 'number' ? failedRate * 100 : undefined,
    iterations: pick(iterations, ['count']),
    thresholdPassed: thresholdPassed ?? (checksPasses != null && checksFails != null ? checksFails === 0 : undefined),
  }
}

function extractThresholdPass(metrics: any) {
  const states: boolean[] = []
  for (const metric of Object.values(metrics || {})) {
    for (const state of Object.values((metric as any)?.thresholds || {})) {
      if (typeof state === 'boolean') states.push(state)
      else if (state && typeof state === 'object' && 'ok' in (state as any)) states.push(Boolean((state as any).ok))
    }
  }
  if (!states.length) return undefined
  return states.every(Boolean)
}

function parsePidstat(text: string): ResourceMetrics {
  const lines = text.split(/\r?\n/)
  const samples = new Map<string, { cpu: number; rssKb: number }>()
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('Linux') || line.startsWith('#') || /^Average:/i.test(line)) continue
    const cols = line.split(/\s+/)
    if (cols.length < 15) continue
    const timeKey = `${cols[0]} ${cols[1]} ${cols[2]}`
    const cpu = Number(cols[8])
    const rssKb = Number(cols[13])
    if (!Number.isFinite(cpu) || !Number.isFinite(rssKb)) continue
    const existing = samples.get(timeKey) || { cpu: 0, rssKb: 0 }
    existing.cpu += cpu
    existing.rssKb += rssKb
    samples.set(timeKey, existing)
  }
  const values = Array.from(samples.values())
  if (!values.length) throw new Error('Could not read CPU/RAM values from the uploaded pidstat file.')
  return {
    meanCpuPct: round(values.reduce((sum, item) => sum + item.cpu, 0) / values.length),
    peakCpuPct: round(Math.max(...values.map((item) => item.cpu))),
    meanRamMb: round(values.reduce((sum, item) => sum + item.rssKb / 1024, 0) / values.length),
    peakRamMb: round(Math.max(...values.map((item) => item.rssKb / 1024))),
  }
}

function detectFromName(name: string): { framework: Framework; scenario: Scenario; runKind: RunKind; runCode: string; vuLevel?: number } {
  const lower = name.toLowerCase()
  const framework: Framework = lower.includes('-sb-') || lower.includes('spring') ? 'Spring Boot' : lower.includes('-dj-') || lower.includes('django') ? 'Django/DRF' : 'Unknown'
  const scenario: Scenario = lower.includes('smoke') ? 'Smoke' : lower.includes('read') ? 'Read-heavy' : 'Unknown'
  const runCode = (lower.match(/-(w\d+|m\d+)(?:-|\.)/)?.[1] || 'm1').toUpperCase()
  const runKind: RunKind = runCode.startsWith('W') ? 'Warm-up' : runCode.startsWith('M') ? 'Measured' : 'Unknown'
  const vuMatch = lower.match(/vu(\d+)/)
  return { framework, scenario, runKind, runCode, vuLevel: vuMatch ? Number(vuMatch[1]) : undefined }
}

function pick(obj: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = obj?.[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

function mean(values: Array<number | undefined>) {
  const nums = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!nums.length) return undefined
  return round(nums.reduce((sum, value) => sum + value, 0) / nums.length)
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function formatMs(value?: number) {
  return value == null ? 'N/A' : `${round(value)} ms`
}

function formatPct(value?: number) {
  return value == null ? 'N/A' : `${round(value)}%`
}

function formatNumber(value?: number, suffix = '') {
  return value == null ? 'N/A' : `${round(value)}${suffix}`
}
