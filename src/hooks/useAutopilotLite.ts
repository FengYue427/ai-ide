import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildSpecStatusSummary } from '../lib/specStatusSummary'
import { isTierCEnabled } from '../lib/intentOsTierC'
import { suggestNextSpecTask, countOpenSpecTasks } from '../services/intentOs/autopilotLiteService'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { consumeAutopilotRunClient, fetchAutopilotQuota, type AutopilotQuota } from '../services/autopilotUsageService'
import { emitAideLinkEvent } from '../lib/aideLinkBus'
import { useIDEStore } from '../store/ideStore'

export function useAutopilotLite(runFirstOpenSpecTask: (tasksPath: string) => void) {
  const files = useIDEStore((s) => s.files)
  const focusTasksPath = useIDEStore((s) => s.intentShellFocusTasksPath)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)
  const queuedChatPrompt = useIDEStore((s) => s.queuedChatPrompt)
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const currentUser = useIDEStore((s) => s.currentUser)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const [quota, setQuota] = useState<AutopilotQuota | null>(null)

  const tasksPath = useMemo(() => {
    const preview = buildRuntimeStatePreview(files)
    return (
      focusTasksPath ??
      preview.activeSpecPath ??
      buildSpecStatusSummary(files).runnableTasksPath ??
      null
    )
  }, [files, focusTasksPath])

  const queueBusy = Boolean(
    queuedSpecBackfill || verifyingSpecBackfill || failedSpecExecution || queuedChatPrompt,
  )

  const suggestion = useMemo(() => {
    if (!isTierCEnabled('autopilotLite') || !tasksPath || queueBusy) return null
    return suggestNextSpecTask(files, tasksPath)
  }, [files, queueBusy, tasksPath])

  const refreshQuota = useCallback(async () => {
    const next = await fetchAutopilotQuota(Boolean(currentUser), currentPlan)
    setQuota(next)
  }, [currentPlan, currentUser])

  useEffect(() => {
    void refreshQuota()
  }, [refreshQuota])

  const runNext = useCallback(async () => {
    if (!suggestion) return
    const consumed = await consumeAutopilotRunClient(Boolean(currentUser), currentPlan)
    if (!consumed.ok) {
      emitAideLinkEvent('entitlement-blocked', { feature: 'autopilot', reason: 'dailyLimit' })
      setShowSubscriptionModal(true)
      await refreshQuota()
      return
    }
    await refreshQuota()
    runFirstOpenSpecTask(suggestion.tasksPath)
  }, [currentPlan, currentUser, refreshQuota, runFirstOpenSpecTask, setShowSubscriptionModal, suggestion])

  return {
    enabled: isTierCEnabled('autopilotLite'),
    suggestion,
    openTaskCount: tasksPath ? countOpenSpecTasks(files, tasksPath) : 0,
    runNext,
    tasksPath,
    quota,
    quotaBlocked: quota ? !quota.allowed && !quota.unlimited : false,
  }
}
