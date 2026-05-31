import type { BottomPanelTab } from '../store/ideStore'

export const BOTTOM_PANEL_PREFS_KEY = 'bottom-panel-prefs'

export const BOTTOM_PANEL_DEFAULT_HEIGHT = 260
export const BOTTOM_PANEL_MIN_HEIGHT = 140
export const BOTTOM_PANEL_MAX_HEIGHT_RATIO = 0.72

export type BottomPanelPrefs = {
  tab: BottomPanelTab
  height: number
}

const VALID_TABS = new Set<BottomPanelTab>(['terminal', 'scripts', 'tasks', 'debug'])

function defaultViewportHeight(): number {
  if (typeof window !== 'undefined' && Number.isFinite(window.innerHeight)) {
    return window.innerHeight
  }
  return 800
}

export function clampBottomPanelHeight(height: number, viewportHeight = defaultViewportHeight()): number {
  const max = Math.max(BOTTOM_PANEL_MIN_HEIGHT, Math.floor(viewportHeight * BOTTOM_PANEL_MAX_HEIGHT_RATIO))
  if (!Number.isFinite(height)) return BOTTOM_PANEL_DEFAULT_HEIGHT
  return Math.min(max, Math.max(BOTTOM_PANEL_MIN_HEIGHT, Math.round(height)))
}

export function normalizeBottomPanelPrefs(raw: unknown): BottomPanelPrefs {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const tab = typeof record.tab === 'string' && VALID_TABS.has(record.tab as BottomPanelTab)
    ? (record.tab as BottomPanelTab)
    : 'terminal'
  const height = clampBottomPanelHeight(Number(record.height))
  return { tab, height }
}

export function mergeBottomPanelPrefs(
  current: BottomPanelPrefs,
  patch: Partial<BottomPanelPrefs>,
): BottomPanelPrefs {
  return {
    tab: patch.tab && VALID_TABS.has(patch.tab) ? patch.tab : current.tab,
    height: patch.height !== undefined ? clampBottomPanelHeight(patch.height) : current.height,
  }
}
