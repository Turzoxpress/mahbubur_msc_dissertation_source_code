import React, { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Badge } from './ui'
import { ArrowRightLeft, PlugZap } from 'lucide-react'
import { fetchWithTimings } from '@/lib/http'

export default function BackendSwitcher(props: {
  baseUrl: string
  onChange: (url: string) => void
}) {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; ms?: number; msg?: string } | null>(null)

  const presets = useMemo(
    () => [
      { label: 'Spring Boot (8090)', url: 'http://localhost:8090' },
      { label: 'Django (8000)', url: 'http://localhost:8000' },
    ],
    [],
  )

  const ping = async () => {
    setChecking(true)
    setStatus(null)
    const r = await fetchWithTimings({
      baseUrl: props.baseUrl,
      path: '/api/ping',
      name: 'Ping',
      expectJson: true,
    })
    setChecking(false)
    if (r.ok) setStatus({ ok: true, ms: r.timings.totalMs })
    else setStatus({ ok: false, ms: r.timings.totalMs, msg: r.error || `HTTP ${r.status}` })
  }

  return (
    <Card>
      <CardHeader
        title="Backend"
        subtitle="Switch between Spring and Django by changing the base URL."
        right={
          <Button variant="secondary" onClick={ping} disabled={checking}>
            <PlugZap className="h-4 w-4" />
            {checking ? 'Checking…' : 'Ping'}
          </Button>
        }
      />
      <CardBody>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              value={props.baseUrl}
              onChange={(e) => props.onChange(e.target.value)}
              placeholder="http://localhost:8090"
            />
            <Button
              variant="ghost"
              title="Swap common ports"
              onClick={() => {
                if (props.baseUrl.includes(':8090')) props.onChange(props.baseUrl.replace(':8090', ':8000'))
                else if (props.baseUrl.includes(':8000')) props.onChange(props.baseUrl.replace(':8000', ':8090'))
              }}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button key={p.url} variant="secondary" onClick={() => props.onChange(p.url)}>
                {p.label}
              </Button>
            ))}
          </div>

          {status ? (
            <div className="flex items-center gap-2">
              <Badge tone={status.ok ? 'ok' : 'bad'}>{status.ok ? 'Reachable' : 'Not reachable'}</Badge>
              <div className="text-sm text-slate-300">
                {status.ok ? `Total: ${status.ms} ms` : `${status.msg || 'Error'} • ${status.ms} ms`}
              </div>
            </div>
          ) : (
           <>
            {/* <div className="text-xs text-slate-500">Tip: Your backend must enable CORS for /api/**.</div> */}
           
           
           </>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
