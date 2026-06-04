/**
 * Panel width persistence for file sidebar and right panel (v1.2.2 F4).
 * @see docs/V1.2.2_F4_PANEL_RESIZE.md
 */

export const PANEL_WIDTH_PREFS_KEY = 'panel-width-prefs'

export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 420
export const SIDEBAR_DEFAULT_WIDTH = 260

export const RIGHT_PANEL_MIN_WIDTH = 280
export const RIGHT_PANEL_MAX_WIDTH = 600
export const RIGHT_PANEL_DEFAULT_WIDTH = 360
export const RIGHT_PANEL_WIDE_DEFAULT_WIDTH = 400
export const RIGHT_PANEL_GIT_DEFAULT_WIDTH = 360

export interface PanelWidthPrefs {
  sidebar: number
  rightPanel: number
}

export function loadPanelWidthPrefs(): PanelWidthPrefs {
  try {
    const raw = localStorage.getItem(PANEL_WIDTH_PREFS_KEY)
    if (!raw) return getDefaultPrefs()
    const parsed = JSON.parse(raw)
    return normalizePanelWidthPrefs(parsed)
  } catch {
    return getDefaultPrefs()
  }
}

export function savePanelWidthPrefs(prefs: PanelWidthPrefs): void {
  try {
    localStorage.setItem(PANEL_WIDTH_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Silently ignore storage errors
  }
}

function getDefaultPrefs(): PanelWidthPrefs {
  return {
    sidebar: SIDEBAR_DEFAULT_WIDTH,
    rightPanel: RIGHT_PANEL_DEFAULT_WIDTH,
  }
}

export function normalizePanelWidthPrefs(raw: unknown): PanelWidthPrefs {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    sidebar: clampSidebarWidth(Number(record.sidebar) || SIDEBAR_DEFAULT_WIDTH),
    rightPanel: clampRightPanelWidth(Number(record.rightPanel) || RIGHT_PANEL_DEFAULT_WIDTH),
  }
}

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)))
}

export function clampRightPanelWidth(width: number): number {
  if (!Number.isFinite(width)) return RIGHT_PANEL_DEFAULT_WIDTH
  return Math.min(RIGHT_PANEL_MAX_WIDTH, Math.max(RIGHT_PANEL_MIN_WIDTH, Math.round(width)))
}

/** CSS variable name for sidebar width. */
export function applySidebarWidthCssVar(width: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--sidebar-width', `${width}px`)
}

/** CSS variable names for right panel widths. */
export function applyRightPanelWidthCssVars(width: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--right-panel-width-chat', `${width}px`)
  document.documentElement.style.setProperty('--right-panel-width-chat-wide', `${Math.min(width + 40, RIGHT_PANEL_MAX_WIDTH)}px`)
  document.documentElement.style.setProperty('--right-panel-width-git', `${width}px`)
}
