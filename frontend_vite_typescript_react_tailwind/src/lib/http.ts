export type Timings = {
  ttfbMs: number
  downloadMs: number
  totalMs: number
}

export type HttpRun = {
  id: string
  name: string
  method: string
  url: string
  status?: number
  ok: boolean
  startedAtIso: string
  timings: Timings
  bytes?: number
  response?: unknown
  error?: string
}

function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

export async function fetchWithTimings(args: {
  baseUrl: string
  path: string
  name: string
  init?: RequestInit
  expectJson?: boolean
}): Promise<HttpRun> {
  const { baseUrl, path, init, name, expectJson = true } = args
  const method = (init?.method || 'GET').toUpperCase()
  const url = joinUrl(baseUrl, path)
  const startedAtIso = new Date().toISOString()

  const t0 = performance.now()
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    })
    const tHeaders = performance.now()

    const text = await res.text()
    const tBody = performance.now()

    let parsed: unknown = text
    if (expectJson) {
      try {
        parsed = text.length ? JSON.parse(text) : null
      } catch {
        parsed = text
      }
    }

    const timings = {
      ttfbMs: round(tHeaders - t0),
      downloadMs: round(tBody - tHeaders),
      totalMs: round(tBody - t0),
    }

    return {
      id: crypto.randomUUID(),
      name,
      method,
      url,
      status: res.status,
      ok: res.ok,
      startedAtIso,
      timings,
      bytes: utf8Bytes(text),
      response: parsed,
    }
  } catch (e: any) {
    const t1 = performance.now()
    return {
      id: crypto.randomUUID(),
      name,
      method,
      url,
      ok: false,
      startedAtIso,
      timings: {
        ttfbMs: round(t1 - t0),
        downloadMs: 0,
        totalMs: round(t1 - t0),
      },
      error: e?.message || String(e),
    }
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

function utf8Bytes(str: string) {
  // Best-effort byte estimate for reporting
  return new TextEncoder().encode(str).length
}
