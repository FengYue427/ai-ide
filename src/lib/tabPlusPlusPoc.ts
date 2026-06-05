/** v1.4.3 — Tab++ spike flag (default off). See docs/V1.5_F1_TAB_PLUS_PLUS.md */

const TAB_PLUS_PLUS_POC_LS = 'ai-ide:feature:tabPlusPlusPoc'

/** v1.4.6 — Tab++ POC latency/debounce targets (experiment only). */
export const TAB_PLUS_PLUS_POC_P95_TARGET_MS = 400
export const TAB_PLUS_PLUS_POC_DEBOUNCE_MS = 280

/** POC only: explicit env or session flag — never auto-on in dev. */
export function isTabPlusPlusPocEnabled(): boolean {
  const raw = import.meta.env.VITE_TAB_PLUS_PLUS_POC
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(TAB_PLUS_PLUS_POC_LS) === '1'
  } catch {
    return false
  }
}

export function enableTabPlusPlusPocForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TAB_PLUS_PLUS_POC_LS, '1')
  }
}

export function disableTabPlusPlusPocForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TAB_PLUS_PLUS_POC_LS)
  }
}
