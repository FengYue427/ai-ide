/**
 * AIDE workspace modes — layout presets for code / plan / execute / review.
 */
import type { BottomPanelTab } from '../store/ideStore'
import { patchCloseAuxiliary } from './workbenchLayout'

export type WorkspaceMode = 'code' | 'plan' | 'execute' | 'review'

export const WORKSPACE_MODE_STORAGE_KEY = 'aide:workspace-mode'

export const WORKSPACE_MODES: WorkspaceMode[] = ['code', 'plan', 'execute', 'review']

export interface WorkspaceModeLayoutPatch {
  showSearchPanel: boolean
  showPreview: boolean
  showCodeReview: boolean
  showPerformance: boolean
  showChatPanel: boolean
  showGitPanel: boolean
  showTerminal: boolean
  bottomPanelTab: BottomPanelTab
  intentShellEnabled: boolean
}

const AUX_OFF = {
  showSearchPanel: false,
  showPreview: false,
  showCodeReview: false,
  showPerformance: false,
} as const

export function getWorkspaceModeLayout(mode: WorkspaceMode): WorkspaceModeLayoutPatch {
  switch (mode) {
    case 'plan':
      return {
        ...AUX_OFF,
        showChatPanel: true,
        showGitPanel: false,
        showTerminal: true,
        bottomPanelTab: 'tasks',
        intentShellEnabled: false,
      }
    case 'execute':
      return {
        ...AUX_OFF,
        showChatPanel: false,
        showGitPanel: false,
        showTerminal: true,
        bottomPanelTab: 'terminal',
        intentShellEnabled: true,
      }
    case 'review':
      return {
        ...AUX_OFF,
        showCodeReview: true,
        showChatPanel: false,
        showGitPanel: true,
        showTerminal: true,
        bottomPanelTab: 'tasks',
        intentShellEnabled: true,
      }
    case 'code':
    default:
      return {
        ...patchCloseAuxiliary(),
        showChatPanel: false,
        showGitPanel: false,
        showTerminal: false,
        bottomPanelTab: 'terminal',
        intentShellEnabled: false,
      } as WorkspaceModeLayoutPatch
  }
}

export function loadWorkspaceMode(): WorkspaceMode {
  if (typeof localStorage === 'undefined') return 'code'
  const raw = localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY)
  if (raw && WORKSPACE_MODES.includes(raw as WorkspaceMode)) return raw as WorkspaceMode
  return 'code'
}

export function saveWorkspaceMode(mode: WorkspaceMode): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode)
}

export function isWorkspaceMode(value: string): value is WorkspaceMode {
  return WORKSPACE_MODES.includes(value as WorkspaceMode)
}
