/** Estimated USD per platform-gateway request (read-only dashboard; not billing truth). */
export function getPlatformCostPerRequestUsd(): number {
  const raw = process.env.PLATFORM_AI_ESTIMATE_USD_PER_REQUEST
  if (!raw) return 0.002
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0.002
}

export function estimatePlatformCostUsd(requestCount: number): number {
  const count = Math.max(0, Math.floor(requestCount))
  const usd = count * getPlatformCostPerRequestUsd()
  return Math.round(usd * 10_000) / 10_000
}
