export function isUnlimitedQuota(limit: number): boolean {
  return limit < 0 || !Number.isFinite(limit)
}

export function formatQuotaLabel(used: number, limit: number): string {
  if (isUnlimitedQuota(limit)) return `${used} / 不限`
  return `${used}/${limit}`
}

export function quotaBarPercent(used: number, limit: number): number {
  if (isUnlimitedQuota(limit)) return used > 0 ? 12 : 0
  if (limit <= 0) return 0
  return Math.min((used / limit) * 100, 100)
}

export function quotaBarColor(used: number, limit: number): string {
  if (isUnlimitedQuota(limit)) return 'var(--success-color)'
  if (used >= limit) return 'var(--danger-color)'
  if (used > limit * 0.8) return 'var(--warning-color)'
  return 'var(--success-color)'
}
