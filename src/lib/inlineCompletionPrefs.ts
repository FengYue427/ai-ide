import { isTabFimProductionEnabled } from './v14Features'
import { isTabPlusPlusPocEnabled, TAB_PLUS_PLUS_POC_DEBOUNCE_MS } from './tabPlusPlusPoc'

const ENABLED_KEY = 'ai-ide:tab-completion-enabled'
const MAX_LINES_KEY = 'ai-ide:tab-completion-max-lines'
const DEBOUNCE_MS_KEY = 'ai-ide:tab-completion-debounce-ms'

export const DEFAULT_TAB_MAX_LINES = 5
export const MIN_TAB_MAX_LINES = 1
export const MAX_TAB_MAX_LINES = 12
/** v1.3.2: slightly higher default reduces empty-line flicker while staying responsive. */
export const DEFAULT_TAB_DEBOUNCE_MS = 350
/** v1.4 F1: production Tab/FIM debounce when VITE_TAB_FIM_PRODUCTION is on. */
export const PRODUCTION_TAB_DEBOUNCE_MS = 300
export const MIN_TAB_DEBOUNCE_MS = 120
export const MAX_TAB_DEBOUNCE_MS = 800

export function isTabCompletionEnabled(): boolean {
  if (isTabFimProductionEnabled()) return true
  if (typeof localStorage === 'undefined') return true // vitest / SSR
  const raw = localStorage.getItem(ENABLED_KEY)
  if (raw === null) return true
  return raw !== 'false'
}

export function setTabCompletionEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false')
}

export function getTabCompletionMaxLines(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_TAB_MAX_LINES
  const raw = localStorage.getItem(MAX_LINES_KEY)
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_TAB_MAX_LINES
  if (!Number.isFinite(n)) return DEFAULT_TAB_MAX_LINES
  return Math.min(MAX_TAB_MAX_LINES, Math.max(MIN_TAB_MAX_LINES, n))
}

export function setTabCompletionMaxLines(lines: number): void {
  if (typeof localStorage === 'undefined') return
  const clamped = Math.min(MAX_TAB_MAX_LINES, Math.max(MIN_TAB_MAX_LINES, lines))
  localStorage.setItem(MAX_LINES_KEY, String(clamped))
}

function defaultTabDebounceMs(): number {
  if (isTabPlusPlusPocEnabled()) return TAB_PLUS_PLUS_POC_DEBOUNCE_MS
  return isTabFimProductionEnabled() ? PRODUCTION_TAB_DEBOUNCE_MS : DEFAULT_TAB_DEBOUNCE_MS
}

export function getTabCompletionDebounceMs(): number {
  if (typeof localStorage === 'undefined') return defaultTabDebounceMs()
  const raw = localStorage.getItem(DEBOUNCE_MS_KEY)
  const n = raw ? Number.parseInt(raw, 10) : defaultTabDebounceMs()
  if (!Number.isFinite(n)) return DEFAULT_TAB_DEBOUNCE_MS
  return Math.min(MAX_TAB_DEBOUNCE_MS, Math.max(MIN_TAB_DEBOUNCE_MS, n))
}

export function setTabCompletionDebounceMs(ms: number): void {
  if (typeof localStorage === 'undefined') return
  const clamped = Math.min(MAX_TAB_DEBOUNCE_MS, Math.max(MIN_TAB_DEBOUNCE_MS, ms))
  localStorage.setItem(DEBOUNCE_MS_KEY, String(clamped))
}
