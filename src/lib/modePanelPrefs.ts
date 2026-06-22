/**
 * Per-mode panel width / rail visibility (localStorage).
 */
import type { WorkspaceMode } from './workspaceMode'
import {
  applyAuxiliaryWidthCssVar,
  applyIntentShellWidthCssVars,
  applyRightPanelWidthCssVars,
  applySidebarWidthCssVar,
  clampAuxiliaryWidth,
  clampIntentShellLeftWidth,
  clampIntentShellQueueWidth,
  clampRightPanelWidth,
  clampSidebarWidth,
  type PanelWidthPrefs,
} from './panelWidthPrefs'

export const MODE_PANEL_PREFS_KEY = 'aide:mode-panel-prefs'

export interface ModePanelSnapshot {
  sidebar: number
  rightPanel: number
  auxiliary: number
  intentShellLeft: number
  intentShellQueue: number
  intentShellGraphOpen: boolean
  intentShellQueueRailOpen: boolean
}

export type ModePanelPrefsStore = Partial<Record<WorkspaceMode, ModePanelSnapshot>>

function readStore(): ModePanelPrefsStore {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(MODE_PANEL_PREFS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ModePanelPrefsStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: ModePanelPrefsStore): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(MODE_PANEL_PREFS_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function snapshotFromPanelPrefs(
  prefs: PanelWidthPrefs,
  rails: { graphOpen: boolean; queueOpen: boolean },
): ModePanelSnapshot {
  return {
    sidebar: prefs.sidebar,
    rightPanel: prefs.rightPanel,
    auxiliary: prefs.auxiliary,
    intentShellLeft: prefs.intentShellLeft,
    intentShellQueue: prefs.intentShellQueue,
    intentShellGraphOpen: rails.graphOpen,
    intentShellQueueRailOpen: rails.queueOpen,
  }
}

export function saveModePanelSnapshot(mode: WorkspaceMode, snapshot: ModePanelSnapshot): void {
  const store = readStore()
  store[mode] = snapshot
  writeStore(store)
}

export function loadModePanelSnapshot(mode: WorkspaceMode): ModePanelSnapshot | null {
  const snap = readStore()[mode]
  if (!snap) return null
  return {
    sidebar: clampSidebarWidth(snap.sidebar),
    rightPanel: clampRightPanelWidth(snap.rightPanel),
    auxiliary: clampAuxiliaryWidth(snap.auxiliary),
    intentShellLeft: clampIntentShellLeftWidth(snap.intentShellLeft),
    intentShellQueue: clampIntentShellQueueWidth(snap.intentShellQueue),
    intentShellGraphOpen: snap.intentShellGraphOpen !== false,
    intentShellQueueRailOpen: snap.intentShellQueueRailOpen !== false,
  }
}

export function applyModePanelSnapshot(snapshot: ModePanelSnapshot): void {
  applySidebarWidthCssVar(snapshot.sidebar)
  applyRightPanelWidthCssVars(snapshot.rightPanel)
  applyAuxiliaryWidthCssVar(snapshot.auxiliary)
  applyIntentShellWidthCssVars(snapshot.intentShellLeft, snapshot.intentShellQueue)
}
