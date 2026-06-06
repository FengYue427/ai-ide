/** v1.4.8 / v1.5 F5 — Activity Line UI flag. See docs/ACTIVITY_LINE.md */

import { isActivityLineProductionEnabled } from './v15Features'

const AIDE_RUNTIME_UI_LS = 'ai-ide:feature:aideRuntimeUi'

/** Legacy stub flag or v1.5 F5 production Activity Line. */
export function isAideRuntimeUiEnabled(): boolean {
  if (isActivityLineProductionEnabled()) return true
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
