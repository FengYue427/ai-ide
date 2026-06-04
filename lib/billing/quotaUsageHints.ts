export function isUnlimitedQuotaLimit(limit: number): boolean {
  return limit < 0 || !Number.isFinite(limit)
}

export function quotaUsagePercent(used: number, limit: number): number {
  if (isUnlimitedQuotaLimit(limit)) return used > 0 ? 12 : 0
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function isQuotaNearLimit(used: number, limit: number, thresholdRatio = 0.8): boolean {
  if (isUnlimitedQuotaLimit(limit)) return false
  if (limit <= 0) return false
  return used / limit >= thresholdRatio
}
