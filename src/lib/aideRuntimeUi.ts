/** v1.4.8 — Activity Line UI flag (default off). See docs/ACTIVITY_LINE.md */

const AIDE_RUNTIME_UI_LS = 'ai-ide:feature:aideRuntimeUi'

/** POC/stub only: explicit env or session flag — never auto-on in dev. */
export function isAideRuntimeUiEnabled(): boolean {
  const raw = import.meta.env.VITE_AIDE_RUNTIME_UI
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(AIDE_RUNTIME_UI_LS) === '1'
  } catch {
    return false
  }
}

export function enableAideRuntimeUiForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(AIDE_RUNTIME_UI_LS, '1')
  }
}

export function disableAideRuntimeUiForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AIDE_RUNTIME_UI_LS)
  }
}
