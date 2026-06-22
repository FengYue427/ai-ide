import { useEffect } from 'react'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { buildSpecAcceptanceLinkage } from '../lib/specAcceptanceLinkage'
import { isPlanFilePath } from '../lib/workspaceModeSuggestions'
import { useIDEStore } from '../store/ideStore'

/** Emits aide link events when workspace signals change (Phase 5.1 wiring). */
export function useAideLinkEmitters(enabled = true): void {
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const workspaceMode = useIDEStore((s) => s.workspaceMode)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)

  useEffect(() => {
    if (!enabled) return
    emitAideLinkEvent('workspace-mode-changed', { mode: workspaceMode })
  }, [enabled, workspaceMode])

  useEffect(() => {
    if (!enabled) return
    const queueActive =
      !!queuedSpecBackfill || !!verifyingSpecBackfill || queuedSpecExecutions.length > 0
    if (queueActive) emitAideLinkEvent('queue-active', { count: queuedSpecExecutions.length + 1 })
  }, [enabled, queuedSpecBackfill, queuedSpecExecutions, verifyingSpecBackfill])

  useEffect(() => {
    if (!enabled) return
    const file = files[activeFile]
    const path = file?.name ?? null
    if (isPlanFilePath(path)) emitAideLinkEvent('plan-file-focused', { path })
  }, [activeFile, enabled, files])

  useEffect(() => {
    if (!enabled) return
    const linkage = buildSpecAcceptanceLinkage(files)
    if (linkage.openTaskCount > 0) {
      emitAideLinkEvent('spec-tasks-open', {
        slug: linkage.activeSpecSlug,
        count: linkage.openTaskCount,
      })
    }
    if (linkage.readyForProof) {
      emitAideLinkEvent('spec-acceptance-ready', {
        slug: linkage.activeSpecSlug,
        acceptancePath: linkage.acceptancePath,
      })
    }
  }, [enabled, files])
}
