/**
 * Persist workbench panel open/close state across sessions (v1.7).
 */
import type { BottomPanelTab, RightPanelView } from '../store/ideStore'
import type { WorkspaceMode } from './workspaceMode'
import { WORKSPACE_MODES } from './workspaceMode'

export const WORKBENCH_LAYOUT_PREFS_KEY = 'workbench-layout-prefs'

export type WorkbenchLayoutPrefs = {
  workspaceMode: WorkspaceMode
  showSearchPanel: boolean
  showPreview: boolean
  showCodeReview: boolean
  showPerformance: boolean
  showChatPanel: boolean
  showGitPanel: boolean
  showTerminal: boolean
  bottomPanelTab: BottomPanelTab
  rightPanelView: RightPanelView
  intentShellEnabled: boolean
  intentShellGraphOpen: boolean
  intentShellQueueRailOpen: boolean
}

const VALID_BOTTOM_TABS = new Set<BottomPanelTab>(['terminal', 'scripts', 'tasks', 'debug'])
const VALID_RIGHT_VIEWS = new Set<RightPanelView>(['chat', 'backgroundJobs'])

export type WorkbenchLayoutStoreSlice = Pick<
  WorkbenchLayoutPrefs,
  | 'workspaceMode'
  | 'showSearchPanel'
  | 'showPreview'
  | 'showCodeReview'
  | 'showPerformance'
  | 'showChatPanel'
  | 'showGitPanel'
  | 'showTerminal'
  | 'bottomPanelTab'
  | 'rightPanelView'
  | 'intentShellEnabled'
  | 'intentShellGraphOpen'
  | 'intentShellQueueRailOpen'
>

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayoutPrefs = {
  workspaceMode: 'code',
  showSearchPanel: false,
  showPreview: false,
  showCodeReview: false,
  showPerformance: false,
  showChatPanel: false,
  showGitPanel: false,
  showTerminal: false,
  bottomPanelTab: 'terminal',
  rightPanelView: 'chat',
  intentShellEnabled: false,
  intentShellGraphOpen: true,
  intentShellQueueRailOpen: true,
}

function readBool(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof record[key] === 'boolean' ? (record[key] as boolean) : fallback
}

export function normalizeWorkbenchLayoutPrefs(raw: unknown): WorkbenchLayoutPrefs | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const mode =
    typeof record.workspaceMode === 'string' && WORKSPACE_MODES.includes(record.workspaceMode as WorkspaceMode)
      ? (record.workspaceMode as WorkspaceMode)
      : 'code'
  const bottomPanelTab =
    typeof record.bottomPanelTab === 'string' && VALID_BOTTOM_TABS.has(record.bottomPanelTab as BottomPanelTab)
      ? (record.bottomPanelTab as BottomPanelTab)
      : 'terminal'
  const rightPanelView =
    typeof record.rightPanelView === 'string' && VALID_RIGHT_VIEWS.has(record.rightPanelView as RightPanelView)
      ? (record.rightPanelView as RightPanelView)
      : 'chat'

  return {
    workspaceMode: mode,
    showSearchPanel: readBool(record, 'showSearchPanel', false),
    showPreview: readBool(record, 'showPreview', false),
    showCodeReview: readBool(record, 'showCodeReview', false),
    showPerformance: readBool(record, 'showPerformance', false),
    showChatPanel: readBool(record, 'showChatPanel', false),
    showGitPanel: readBool(record, 'showGitPanel', false),
    showTerminal: readBool(record, 'showTerminal', false),
    bottomPanelTab,
    rightPanelView,
    intentShellEnabled: readBool(record, 'intentShellEnabled', false),
    intentShellGraphOpen: readBool(record, 'intentShellGraphOpen', true),
    intentShellQueueRailOpen: readBool(record, 'intentShellQueueRailOpen', true),
  }
}

export function snapshotWorkbenchLayout(state: WorkbenchLayoutStoreSlice): WorkbenchLayoutPrefs {
  return {
    workspaceMode: state.workspaceMode,
    showSearchPanel: state.showSearchPanel,
    showPreview: state.showPreview,
    showCodeReview: state.showCodeReview,
    showPerformance: state.showPerformance,
    showChatPanel: state.showChatPanel,
    showGitPanel: state.showGitPanel,
    showTerminal: state.showTerminal,
    bottomPanelTab: state.bottomPanelTab,
    rightPanelView: state.rightPanelView,
    intentShellEnabled: state.intentShellEnabled,
    intentShellGraphOpen: state.intentShellGraphOpen,
    intentShellQueueRailOpen: state.intentShellQueueRailOpen,
  }
}

export function workbenchLayoutToStorePatch(prefs: WorkbenchLayoutPrefs): WorkbenchLayoutStoreSlice {
  return { ...prefs }
}

/** Optional visibility fields stored inside per-mode / per-project panel snapshots. */
export type WorkbenchVisibilitySnapshot = Pick<
  WorkbenchLayoutPrefs,
  | 'showSearchPanel'
  | 'showPreview'
  | 'showCodeReview'
  | 'showPerformance'
  | 'showChatPanel'
  | 'showGitPanel'
  | 'showTerminal'
  | 'bottomPanelTab'
  | 'rightPanelView'
>

export function hasWorkbenchVisibilitySnapshot(
  snap: Partial<WorkbenchVisibilitySnapshot> | null | undefined,
): boolean {
  if (!snap) return false
  return (
    typeof snap.showGitPanel === 'boolean' ||
    typeof snap.showChatPanel === 'boolean' ||
    typeof snap.showCodeReview === 'boolean' ||
    typeof snap.showTerminal === 'boolean'
  )
}

export function visibilityFromSnapshot(
  snap: Partial<WorkbenchVisibilitySnapshot>,
): WorkbenchVisibilitySnapshot {
  return {
    showSearchPanel: snap.showSearchPanel === true,
    showPreview: snap.showPreview === true,
    showCodeReview: snap.showCodeReview === true,
    showPerformance: snap.showPerformance === true,
    showChatPanel: snap.showChatPanel === true,
    showGitPanel: snap.showGitPanel === true,
    showTerminal: snap.showTerminal === true,
    bottomPanelTab:
      typeof snap.bottomPanelTab === 'string' && VALID_BOTTOM_TABS.has(snap.bottomPanelTab)
        ? snap.bottomPanelTab
        : 'terminal',
    rightPanelView:
      typeof snap.rightPanelView === 'string' && VALID_RIGHT_VIEWS.has(snap.rightPanelView)
        ? snap.rightPanelView
        : 'chat',
  }
}
