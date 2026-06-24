import { useEffect, useRef } from 'react'
import { isWorkbenchLayoutHydrated } from '../lib/workbenchLayoutHydration'
import { saveWorkbenchLayoutPrefs } from '../services/workbenchLayoutPrefsService'
import { useIDEStore } from '../store/ideStore'

/** Debounced localStorage sync for workbench panel visibility (v1.7). */
export function useWorkbenchLayoutPersistence() {
  const layout = useIDEStore((s) => ({
    workspaceMode: s.workspaceMode,
    showSearchPanel: s.showSearchPanel,
    showPreview: s.showPreview,
    showCodeReview: s.showCodeReview,
    showPerformance: s.showPerformance,
    showChatPanel: s.showChatPanel,
    showGitPanel: s.showGitPanel,
    showTerminal: s.showTerminal,
    bottomPanelTab: s.bottomPanelTab,
    rightPanelView: s.rightPanelView,
    intentShellEnabled: s.intentShellEnabled,
    intentShellGraphOpen: s.intentShellGraphOpen,
    intentShellQueueRailOpen: s.intentShellQueueRailOpen,
  }))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isWorkbenchLayoutHydrated()) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void saveWorkbenchLayoutPrefs(layout)
    }, 250)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [layout])
}
