const STORAGE_KEY = 'ai-ide:semantic-search-enabled'

export function isSemanticSearchEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return true
  return raw !== 'false'
}

export function setSemanticSearchEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}
