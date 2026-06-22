import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useI18n } from '../i18n'
import { patchOpenChatPanel } from '../lib/workbenchLayout'
import { shouldShowIntentShell } from '../lib/intentShellFeatures'
import { useChatQueueReport } from './useChatQueueReport'
import { useSpecQueueCoordinatorDeps } from './useSpecQueueCoordinatorDeps'
import {
  isIntentDemoSpecPath,
  markIntentDemoLevelComplete,
} from '../services/intentOs/intentDemoAcceptanceService'
import { buildIntentReplayManifestFromLatest, buildIntentReplayApplyPlan } from '../services/intentOs/intentReplayService'
import { isTierCFeatureLocked } from '../lib/planFeatureGate'
import { onSpecQueueItemSucceeded } from '../services/runtime/runtimeQueueCoordinator'
import {
  clearRuntimeQueuePause,
  getRuntimeQueuePause,
  subscribeRuntimeQueuePause,
} from '../services/runtime/runtimeQueuePause'
import { buildRuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import { useIDEStore } from '../store/ideStore'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TaskQueuePanelProps } from '../components/TaskQueuePanel'

export interface UseIntentQueueRailOptions {
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  openChatPanel: () => void
}

export function useIntentQueueRail({ notify, openChatPanel }: UseIntentQueueRailOptions) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const intentShellEnabled = useIDEStore((s) => s.intentShellEnabled)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const queuedChatPrompt = useIDEStore((s) => s.queuedChatPrompt)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)
  const verifyingSpecBackfill = useIDEStore((s) => s.verifyingSpecBackfill)
  const lastGroundingBlock = useIDEStore((s) => s.lastGroundingBlock)
  const setLastGroundingBlock = useIDEStore((s) => s.setLastGroundingBlock)
  const queuedSpecExecutions = useIDEStore((s) => s.queuedSpecExecutions)
  const queuedPlanExecutions = useIDEStore((s) => s.queuedPlanExecutions)
  const queuedPlanBackfill = useIDEStore((s) => s.queuedPlanBackfill)
  const setQueuedChatPrompt = useIDEStore((s) => s.setQueuedChatPrompt)
  const setQueuedSpecBackfill = useIDEStore((s) => s.setQueuedSpecBackfill)
  const setQueuedPlanBackfill = useIDEStore((s) => s.setQueuedPlanBackfill)
  const setQueuedSpecExecutions = useIDEStore((s) => s.setQueuedSpecExecutions)
  const setQueuedPlanExecutions = useIDEStore((s) => s.setQueuedPlanExecutions)
  const failedSpecExecution = useIDEStore((s) => s.failedSpecExecution)
  const failedPlanExecution = useIDEStore((s) => s.failedPlanExecution)
  const setFailedSpecExecution = useIDEStore((s) => s.setFailedSpecExecution)
  const setFailedPlanExecution = useIDEStore((s) => s.setFailedPlanExecution)
  const queueFailureStats = useIDEStore((s) => s.queueFailureStats)
  const setQueueFailureStats = useIDEStore((s) => s.setQueueFailureStats)
  const queueSuccessStats = useIDEStore((s) => s.queueSuccessStats)
  const setQueueSuccessStats = useIDEStore((s) => s.setQueueSuccessStats)
  const recentDoneQueueItems = useIDEStore((s) => s.recentDoneQueueItems)
  const setRecentDoneQueueItems = useIDEStore((s) => s.setRecentDoneQueueItems)
  const setIntentShellFocusTasksPath = useIDEStore((s) => s.setIntentShellFocusTasksPath)
  const setIntentReplayGraphOverlay = useIDEStore((s) => s.setIntentReplayGraphOverlay)

  const specQueueDeps = useSpecQueueCoordinatorDeps()
  const runtimeQueuePause = useSyncExternalStore(subscribeRuntimeQueuePause, getRuntimeQueuePause, getRuntimeQueuePause)

  const shellVisible = shouldShowIntentShell(files, intentShellEnabled)
  const replayManifest = useMemo(
    () => (shellVisible ? buildIntentReplayManifestFromLatest(files) : null),
    [files, shellVisible],
  )
  const replayLocked = Boolean(replayManifest && isTierCFeatureLocked('intentReplay'))

  const sessionStatus = useMemo(() => {
    if (
      queuedChatPrompt ||
      queuedSpecBackfill ||
      verifyingSpecBackfill ||
      queuedSpecExecutions.length > 0 ||
      queuedPlanExecutions.length > 0
    ) {
      return 'queued' as const
    }
    return 'idle' as const
  }, [
    queuedChatPrompt,
    queuedPlanExecutions.length,
    queuedSpecBackfill,
    queuedSpecExecutions.length,
    verifyingSpecBackfill,
  ])

  const activeQueueTask = useMemo(() => {
    if (queuedPlanBackfill) return t('chat.queue.activePlan', { text: queuedPlanBackfill.stepText })
    if (queuedSpecBackfill) return t('chat.queue.activeSpec', { text: queuedSpecBackfill.taskText })
    if (verifyingSpecBackfill) return t('chat.queue.activeSpec', { text: verifyingSpecBackfill.taskText })
    return null
  }, [queuedPlanBackfill, queuedSpecBackfill, t, verifyingSpecBackfill])

  const copyMessageText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }, [])

  const {
    exportQueueReport,
    saveQueueReportToWorkspace,
    saveProofOfDoneToWorkspace,
    openLatestQueueReport,
    restoreQueueFromLatestReport,
  } = useChatQueueReport({
    sessionStatus,
    runId: null,
    activeQueueTask,
    loading: false,
    sendQueue: [],
    queuedChatPrompt,
    queuedSpecBackfill,
    queuedSpecExecutions,
    queuedPlanBackfill,
    queuedPlanExecutions,
    failedPlanExecution,
    failedSpecExecution,
    queueFailureStats,
    queueSuccessStats,
    recentDoneQueueItems,
    editorFiles: files,
    setFiles,
    setActiveFile,
    setFailedPlanExecution,
    setFailedSpecExecution,
    setQueuedChatPrompt,
    setQueuedPlanBackfill,
    setQueuedSpecBackfill,
    setQueuedPlanExecutions,
    setQueuedSpecExecutions,
    copyMessageText,
    notify,
    t,
  })

  const openChatForRetry = useCallback(
    (prompt: string, backfill?: { kind: 'spec' | 'plan'; value: unknown }) => {
      if (backfill?.kind === 'spec') {
        setQueuedSpecBackfill(backfill.value as typeof queuedSpecBackfill)
      }
      if (backfill?.kind === 'plan') {
        setQueuedPlanBackfill(backfill.value as typeof queuedPlanBackfill)
      }
      setQueuedChatPrompt(prompt)
      useIDEStore.setState(patchOpenChatPanel())
      openChatPanel()
    },
    [openChatPanel, setQueuedChatPrompt, setQueuedPlanBackfill, setQueuedSpecBackfill],
  )

  const handleMarkIntentDemoComplete = useCallback(async () => {
    if (!failedSpecExecution || !isIntentDemoSpecPath(failedSpecExecution.backfill.taskPath)) return
    const marked = markIntentDemoLevelComplete(files, failedSpecExecution.backfill)
    if (!marked.ok) {
      notify?.('info', t('intent.demo.markBlocked.title'), t('intent.demo.markBlocked.detail'))
      return
    }
    setFiles(marked.files)
    const verify = await onSpecQueueItemSucceeded(failedSpecExecution.backfill, specQueueDeps)
    if (!verify.verifyOk) {
      setFailedSpecExecution({
        ...failedSpecExecution,
        error: verify.verifyDetail ?? t('runtime.verifyFail.detail'),
      })
      return
    }
    setFailedSpecExecution(null)
    setQueueSuccessStats((prev) => ({ ...prev, spec: prev.spec + 1 }))
    setRecentDoneQueueItems((prev) =>
      [{ kind: 'spec' as const, text: failedSpecExecution.backfill.taskText }, ...prev].slice(0, 5),
    )
    notify?.('success', t('intent.demo.reportGuide.title'), t('intent.demo.reportGuide.detail'))
  }, [
    failedSpecExecution,
    files,
    notify,
    setFailedSpecExecution,
    setFiles,
    setQueueSuccessStats,
    setRecentDoneQueueItems,
    specQueueDeps,
    t,
  ])

  const restoreFromProof = useCallback(() => {
    if (!replayManifest || replayLocked) return
    const plan = buildIntentReplayApplyPlan(replayManifest)
    setIntentShellFocusTasksPath(plan.focusTasksPath)
    setIntentReplayGraphOverlay(plan.graphOverlay)
    if (plan.clearFailedSpec) {
      setFailedSpecExecution(null)
    }
    restoreQueueFromLatestReport()
    if (plan.openProofInEditor) {
      const proofIndex = files.findIndex(
        (file) => file.name.replace(/\\/g, '/') === plan.proofPath,
      )
      if (proofIndex >= 0) {
        setActiveFile(proofIndex)
      }
    }
    notify?.(
      'success',
      t('intent.replay.restored.title'),
      t('intent.replay.restored.detail', { slug: replayManifest.specSlug }),
    )
  }, [
    files,
    notify,
    replayManifest,
    replayLocked,
    restoreQueueFromLatestReport,
    setActiveFile,
    setFailedSpecExecution,
    setIntentReplayGraphOverlay,
    setIntentShellFocusTasksPath,
    t,
  ])

  const panelProps: TaskQueuePanelProps = {
    sessionStatus,
    runId: null,
    activeQueueTask,
    queuedChatPrompt,
    queuedPlanExecutions,
    queuedSpecExecutions,
    queuedSpecBackfill,
    verifyingSpecBackfill,
    lastGroundingBlock,
    sendQueue: [],
    queueFailureStats,
    queueSuccessStats,
    recentDoneQueueItems,
    failedPlanExecution,
    failedSpecExecution,
    runtimeQueuePause,
    onResumeRuntimeQueue: () => {
      clearRuntimeQueuePause()
      notify?.('success', t('runtime.queuePaused.resumedTitle'), t('runtime.queuePaused.resumedDetail'))
    },
    onExportReport: exportQueueReport,
    onSaveReport: saveQueueReportToWorkspace,
    onSaveProof: () => saveProofOfDoneToWorkspace(),
    onOpenLatestReport: openLatestQueueReport,
    onRestoreFromLatestReport: restoreQueueFromLatestReport,
    onResetFailureStats: () => setQueueFailureStats({ plan: 0, spec: 0 }),
    onResetSuccessStats: () => setQueueSuccessStats({ plan: 0, spec: 0 }),
    onClearSpecQueue: () => setQueuedSpecExecutions([]),
    onClearPlanQueue: () => setQueuedPlanExecutions([]),
    onRetryFailedPlan: () => {
      if (!failedPlanExecution) return
      setFailedPlanExecution(null)
      openChatForRetry(failedPlanExecution.prompt, { kind: 'plan', value: failedPlanExecution.backfill })
    },
    onSkipFailedPlan: () => setFailedPlanExecution(null),
    onRetryFailedSpec: () => {
      if (!failedSpecExecution) return
      setFailedSpecExecution(null)
      openChatForRetry(failedSpecExecution.prompt, { kind: 'spec', value: failedSpecExecution.backfill })
    },
    onSkipFailedSpec: () => setFailedSpecExecution(null),
    onDismissGroundingBlock: () => setLastGroundingBlock(null),
    showIntentDemoVerifyBanner: Boolean(
      failedSpecExecution && isIntentDemoSpecPath(failedSpecExecution.backfill.taskPath),
    ),
    onMarkIntentDemoComplete: () => void handleMarkIntentDemoComplete(),
  }

  const focusTasksPath = useIDEStore((s) => s.intentShellFocusTasksPath)
  const activeSpecPath = buildRuntimeStatePreview(files).activeSpecPath

  return {
    shellVisible,
    panelProps,
    replayManifest,
    replayLocked,
    restoreFromProof,
    focusTasksPath: focusTasksPath ?? activeSpecPath,
  }
}
