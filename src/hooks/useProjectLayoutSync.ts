import { useEffect, useRef } from 'react'
import type { FileItem } from '../types/file'
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
import { getWorkspaceModeLayout } from '../lib/workspaceMode'
import { saveIntentShellPreference } from '../lib/intentShellFeatures'
import { useIDEStore } from '../store/ideStore'

/** Restore / persist layout per project fingerprint (Phase 6.3). */
export function useProjectLayoutSync(files: FileItem[], enabled = true): void {
  const workspaceMode = useIDEStore((s) => s.workspaceMode)
  const intentShellGraphOpen = useIDEStore((s) => s.intentShellGraphOpen)
  const intentShellQueueRailOpen = useIDEStore((s) => s.intentShellQueueRailOpen)
  const fingerprint = enabled && files.length > 0 ? buildWorkspaceFingerprint(files) : null
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !fingerprint || files.length === 0) return
    if (loadedRef.current === fingerprint) return
    const saved = loadProjectLayoutSnapshot(fingerprint)
    loadedRef.current = fingerprint
    if (!saved) return
    const layout = getWorkspaceModeLayout(saved.workspaceMode)
    saveIntentShellPreference(layout.intentShellEnabled)
    useIDEStore.setState({
      workspaceMode: saved.workspaceMode,
      ...layout,
      intentShellGraphOpen: saved.panels.intentShellGraphOpen,
      intentShellQueueRailOpen: saved.panels.intentShellQueueRailOpen,
    })
    applyModePanelSnapshot(saved.panels)
  }, [enabled, fingerprint, files.length])

  useEffect(() => {
    if (!enabled || !fingerprint || files.length === 0) return
    const prefs = loadPanelWidthPrefs()
    const panels = snapshotFromPanelPrefs(prefs, {
      graphOpen: intentShellGraphOpen,
      queueOpen: intentShellQueueRailOpen,
    })
    saveProjectLayoutSnapshot(fingerprint, { workspaceMode, panels })
    saveModePanelSnapshot(workspaceMode, panels)
  }, [enabled, fingerprint, files.length, workspaceMode, intentShellGraphOpen, intentShellQueueRailOpen])
}
