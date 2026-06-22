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

export const AUXILIARY_MIN_WIDTH = 260
export const AUXILIARY_MAX_WIDTH = 560
export const AUXILIARY_DEFAULT_WIDTH = 360

export const INTENT_SHELL_LEFT_MIN_WIDTH = 160
export const INTENT_SHELL_LEFT_MAX_WIDTH = 420
export const INTENT_SHELL_LEFT_DEFAULT_WIDTH = 240

export const INTENT_SHELL_QUEUE_MIN_WIDTH = 220
export const INTENT_SHELL_QUEUE_MAX_WIDTH = 480
export const INTENT_SHELL_QUEUE_DEFAULT_WIDTH = 300

export interface PanelWidthPrefs {
  sidebar: number
  rightPanel: number
  auxiliary: number
  intentShellLeft: number
  intentShellQueue: number
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
    auxiliary: AUXILIARY_DEFAULT_WIDTH,
    intentShellLeft: INTENT_SHELL_LEFT_DEFAULT_WIDTH,
    intentShellQueue: INTENT_SHELL_QUEUE_DEFAULT_WIDTH,
  }
}

export function normalizePanelWidthPrefs(raw: unknown): PanelWidthPrefs {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    sidebar: clampSidebarWidth(Number(record.sidebar) || SIDEBAR_DEFAULT_WIDTH),
    rightPanel: clampRightPanelWidth(Number(record.rightPanel) || RIGHT_PANEL_DEFAULT_WIDTH),
    auxiliary: clampAuxiliaryWidth(Number(record.auxiliary) || AUXILIARY_DEFAULT_WIDTH),
    intentShellLeft: clampIntentShellLeftWidth(
      Number(record.intentShellLeft) || INTENT_SHELL_LEFT_DEFAULT_WIDTH,
    ),
    intentShellQueue: clampIntentShellQueueWidth(
      Number(record.intentShellQueue) || INTENT_SHELL_QUEUE_DEFAULT_WIDTH,
    ),
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

export function clampAuxiliaryWidth(width: number): number {
  if (!Number.isFinite(width)) return AUXILIARY_DEFAULT_WIDTH
  return Math.min(AUXILIARY_MAX_WIDTH, Math.max(AUXILIARY_MIN_WIDTH, Math.round(width)))
}

export function clampIntentShellLeftWidth(width: number): number {
  if (!Number.isFinite(width)) return INTENT_SHELL_LEFT_DEFAULT_WIDTH
  return Math.min(
    INTENT_SHELL_LEFT_MAX_WIDTH,
    Math.max(INTENT_SHELL_LEFT_MIN_WIDTH, Math.round(width)),
  )
}

export function clampIntentShellQueueWidth(width: number): number {
  if (!Number.isFinite(width)) return INTENT_SHELL_QUEUE_DEFAULT_WIDTH
  return Math.min(
    INTENT_SHELL_QUEUE_MAX_WIDTH,
    Math.max(INTENT_SHELL_QUEUE_MIN_WIDTH, Math.round(width)),
  )
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

export function applyAuxiliaryWidthCssVar(width: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--workbench-auxiliary-width', `${width}px`)
}

export function applyIntentShellWidthCssVars(left: number, queue: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--intent-shell-left-width', `${left}px`)
  document.documentElement.style.setProperty('--intent-shell-queue-width', `${queue}px`)
}
