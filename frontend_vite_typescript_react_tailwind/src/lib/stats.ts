export type Summary = {
  count: number
  ok: number
  failed: number
  errorRate: number
  minMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  maxMs: number
  rps: number
}

export function summarizeDurations(durationsMs: number[], okCount: number, totalSeconds: number): Summary {
  const count = durationsMs.length
  const sorted = [...durationsMs].sort((a, b) => a - b)
  const failed = Math.max(0, count - okCount)
  const errorRate = count ? failed / count : 0

  const sum = durationsMs.reduce((acc, v) => acc + v, 0)
  const avgMs = count ? sum / count : 0

  const q = (p: number) => percentile(sorted, p)

  return {
    count,
    ok: okCount,
    failed,
    errorRate,
    minMs: count ? sorted[0] : 0,
    avgMs: round(avgMs),
    p50Ms: round(q(0.5)),
    p95Ms: round(q(0.95)),
    p99Ms: round(q(0.99)),
    maxMs: count ? sorted[sorted.length - 1] : 0,
    rps: totalSeconds > 0 ? round(count / totalSeconds) : 0,
  }
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const w = idx - lo
  return sorted[lo] * (1 - w) + sorted[hi] * w
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
