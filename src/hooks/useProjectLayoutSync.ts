import { useEffect, useRef } from 'react'
import type { FileItem } from '../types/file'
import { markWorkbenchLayoutHydrated, isWorkbenchLayoutHydrated } from '../lib/workbenchLayoutHydration'
import { buildRestoredWorkbenchState, visibilityFromSnapshot } from '../lib/workbenchLayoutPrefs'
import {
  applyModePanelSnapshot,
  saveModePanelSnapshot,
  snapshotFromPanelPrefs,
} from '../lib/modePanelPrefs'
import {
  buildWorkspaceFingerprint,
  loadProjectLayoutSnapshot,
  saveProjectLayoutSnapshot,
} from '../lib/projectLayoutPrefs'
import { loadPanelWidthPrefs } from '../lib/panelWidthPrefs'
import { saveIntentShellPreference } from '../lib/intentShellFeatures'
import { loadWorkbenchLayoutPrefsSync } from '../services/workbenchLayoutPrefsService'
import { useIDEStore } from '../store/ideStore'

/** Restore / persist layout per project fingerprint (Phase 6.3). */
export function useProjectLayoutSync(files: FileItem[], enabled = true): void {
  const workspaceMode = useIDEStore((s) => s.workspaceMode)
  const intentShellGraphOpen = useIDEStore((s) => s.intentShellGraphOpen)
  const intentShellQueueRailOpen = useIDEStore((s) => s.intentShellQueueRailOpen)
  const showSearchPanel = useIDEStore((s) => s.showSearchPanel)
  const showPreview = useIDEStore((s) => s.showPreview)
  const showCodeReview = useIDEStore((s) => s.showCodeReview)
  const showPerformance = useIDEStore((s) => s.showPerformance)
  const showChatPanel = useIDEStore((s) => s.showChatPanel)
  const showGitPanel = useIDEStore((s) => s.showGitPanel)
  const showTerminal = useIDEStore((s) => s.showTerminal)
  const bottomPanelTab = useIDEStore((s) => s.bottomPanelTab)
  const rightPanelView = useIDEStore((s) => s.rightPanelView)
  const fingerprint = enabled && files.length > 0 ? buildWorkspaceFingerprint(files) : null
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !fingerprint || files.length === 0) return
    if (loadedRef.current === fingerprint) return
    const saved = loadProjectLayoutSnapshot(fingerprint)
    loadedRef.current = fingerprint
    const globalPrefs = loadWorkbenchLayoutPrefsSync()

    if (!saved) {
      markWorkbenchLayoutHydrated()
      return
    }

    const restored = buildRestoredWorkbenchState({
      workspaceMode: saved.workspaceMode,
      panelSnapshot: saved.panels,
      globalPrefs,
    })
    saveIntentShellPreference(restored.intentShellEnabled)
    useIDEStore.setState(restored)
    applyModePanelSnapshot(saved.panels)
    markWorkbenchLayoutHydrated()
  }, [enabled, fingerprint, files.length])

  useEffect(() => {
    if (!enabled || !fingerprint || files.length === 0) return
    if (!isWorkbenchLayoutHydrated()) return
    const prefs = loadPanelWidthPrefs()
    const panels = snapshotFromPanelPrefs(
      prefs,
      {
        graphOpen: intentShellGraphOpen,
        queueOpen: intentShellQueueRailOpen,
      },
      visibilityFromSnapshot({
        showSearchPanel,
        showPreview,
        showCodeReview,
        showPerformance,
        showChatPanel,
        showGitPanel,
        showTerminal,
        bottomPanelTab,
        rightPanelView,
      }),
    )
    saveProjectLayoutSnapshot(fingerprint, { workspaceMode, panels })
    saveModePanelSnapshot(workspaceMode, panels)
  }, [
    enabled,
    fingerprint,
    files.length,
    workspaceMode,
    intentShellGraphOpen,
    intentShellQueueRailOpen,
    showSearchPanel,
    showPreview,
    showCodeReview,
    showPerformance,
    showChatPanel,
    showGitPanel,
    showTerminal,
    bottomPanelTab,
    rightPanelView,
  ])
}
