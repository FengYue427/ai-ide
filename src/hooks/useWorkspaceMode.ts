import { useCallback } from 'react'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { NARROW_BREAKPOINT_PX } from '../hooks/useNarrowViewport'
import { patchCloseAuxiliary } from '../lib/workbenchLayout'
import { saveIntentShellPreference } from '../lib/intentShellFeatures'
import { markWorkbenchLayoutHydrated } from '../lib/workbenchLayoutHydration'
import { workbenchLayoutToStorePatch, visibilityFromSnapshot } from '../lib/workbenchLayoutPrefs'
import {
  applyModePanelSnapshot,
  loadModePanelSnapshot,
  saveModePanelSnapshot,
  snapshotFromPanelPrefs,
} from '../lib/modePanelPrefs'
import { loadPanelWidthPrefs } from '../lib/panelWidthPrefs'
import {
  getWorkspaceModeLayout,
  loadWorkspaceMode,
  saveWorkspaceMode,
  type WorkspaceMode,
} from '../lib/workspaceMode'
import { loadWorkbenchLayoutPrefs } from '../services/workbenchLayoutPrefsService'
import { buildWorkspaceFingerprint, loadProjectLayoutSnapshot } from '../lib/projectLayoutPrefs'
import { useIDEStore } from '../store/ideStore'

export function useWorkspaceMode() {
  const workspaceMode = useIDEStore((s) => s.workspaceMode)

  const applyWorkspaceMode = useCallback((nextMode: WorkspaceMode) => {
    const state = useIDEStore.getState()
    const currentMode = state.workspaceMode

    const prefs = loadPanelWidthPrefs()
    saveModePanelSnapshot(
      currentMode,
      snapshotFromPanelPrefs(
        prefs,
        {
          graphOpen: state.intentShellGraphOpen,
          queueOpen: state.intentShellQueueRailOpen,
        },
        visibilityFromSnapshot({
          showSearchPanel: state.showSearchPanel,
          showPreview: state.showPreview,
          showCodeReview: state.showCodeReview,
          showPerformance: state.showPerformance,
          showChatPanel: state.showChatPanel,
          showGitPanel: state.showGitPanel,
          showTerminal: state.showTerminal,
          bottomPanelTab: state.bottomPanelTab,
          rightPanelView: state.rightPanelView,
        }),
      ),
    )

    const layout = getWorkspaceModeLayout(nextMode)
    saveIntentShellPreference(layout.intentShellEnabled)

    useIDEStore.setState({
      workspaceMode: nextMode,
      ...layout,
      intentShellGraphOpen: true,
      intentShellQueueRailOpen: true,
    })

    const snap = loadModePanelSnapshot(nextMode)
    if (snap) {
      applyModePanelSnapshot(snap)
      useIDEStore.setState({
        intentShellGraphOpen: snap.intentShellGraphOpen,
        intentShellQueueRailOpen: snap.intentShellQueueRailOpen,
      })
    }

    if (typeof window !== 'undefined' && window.innerWidth <= NARROW_BREAKPOINT_PX) {
      useIDEStore.setState(patchCloseAuxiliary())
    }

    saveWorkspaceMode(nextMode)
    emitAideLinkEvent('workspace-mode-changed', { mode: nextMode })
  }, [])

  const initWorkspaceMode = useCallback(() => {
    void (async () => {
      try {
        const { files } = useIDEStore.getState()
        if (files.length > 0) {
          const projectSaved = loadProjectLayoutSnapshot(buildWorkspaceFingerprint(files))
          if (projectSaved) return
        }

        const savedLayout = await loadWorkbenchLayoutPrefs()
        if (savedLayout) {
          saveIntentShellPreference(savedLayout.intentShellEnabled)
          useIDEStore.setState(workbenchLayoutToStorePatch(savedLayout))
          const snap = loadModePanelSnapshot(savedLayout.workspaceMode)
          if (snap) {
            applyModePanelSnapshot(snap)
            useIDEStore.setState({
              intentShellGraphOpen: snap.intentShellGraphOpen,
              intentShellQueueRailOpen: snap.intentShellQueueRailOpen,
            })
          }
          return
        }

        const mode = loadWorkspaceMode()
        const layout = getWorkspaceModeLayout(mode)
        saveIntentShellPreference(layout.intentShellEnabled)
        useIDEStore.setState({ workspaceMode: mode, ...layout })
        const snap = loadModePanelSnapshot(mode)
        if (snap) {
          applyModePanelSnapshot(snap)
          useIDEStore.setState({
            intentShellGraphOpen: snap.intentShellGraphOpen,
            intentShellQueueRailOpen: snap.intentShellQueueRailOpen,
          })
        }
      } finally {
        markWorkbenchLayoutHydrated()
      }
    })()
  }, [])

  return { workspaceMode, applyWorkspaceMode, initWorkspaceMode }
}
