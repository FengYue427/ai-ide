const STORAGE_KEY = 'ai-ide:activity-line-collapsed-v157'

/** v1.5.7 — Activity Line defaults collapsed; persist user preference. */
export function readActivityLineCollapsed(defaultCollapsed = true): boolean {
  if (typeof localStorage === 'undefined') return defaultCollapsed
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === '0') return false
  if (raw === '1') return true
  return defaultCollapsed
}

export function writeActivityLineCollapsed(collapsed: boolean): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
}
