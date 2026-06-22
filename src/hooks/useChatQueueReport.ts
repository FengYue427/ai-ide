import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  buildQueueExecutionReportMarkdown,
  buildQueueReportPath,
  upsertQueueReportFile,
  type QueueExecutionReportInput,
} from '../services/queueExecutionReportService'
import {
  buildProofOfDoneHtml,
  buildProofOfDoneMarkdown,
  buildProofReportPaths,
  resolveProofTasksPath,
  upsertProofReportFiles,
} from '../services/intentOs/proofOfDoneReportService'
import { canUseEntitlement } from '../lib/planFeatureGate'
import { findLatestReportPath } from '../services/reportCatalogService'
import {
  buildQueueRestoreFromReport,
  mergePlanRestoreItems,
  mergeSpecRestoreItems,
} from '../services/queueReportRestoreService'
import {
  loadQueueAutoReportPrefs,
  notifyQueueComplete,
} from '../services/queueAutoReportPrefsService'
import type { ChatSessionStatus, PendingSend } from '../services/chatSessionOrchestrator'
import type { TranslateFn } from '../i18n'
import type { ToastKind } from '../components/FeedbackCenter'
import type { FileItem } from '../types/file'
import type {
  FailedPlanExecution,
  FailedSpecExecution,
  RecentDoneQueueItem,
} from '../components/TaskQueuePanel'
import type { QueuedPlanExecution, QueuedSpecExecution, QueuedSpecBackfill, QueuedPlanBackfill } from '../store/ideStore'

export interface UseChatQueueReportParams {
  sessionStatus: ChatSessionStatus
  runId: string | null
  activeQueueTask: string | null
  loading: boolean
  sendQueue: PendingSend[]
  queuedChatPrompt: string | null
  queuedSpecBackfill: QueuedSpecBackfill | null
  queuedSpecExecutions: QueuedSpecExecution[]
  queuedPlanBackfill: QueuedPlanBackfill | null
  queuedPlanExecutions: QueuedPlanExecution[]
  failedPlanExecution: FailedPlanExecution | null
  failedSpecExecution: FailedSpecExecution | null
  queueFailureStats: { plan: number; spec: number }
  queueSuccessStats: { plan: number; spec: number }
  recentDoneQueueItems: RecentDoneQueueItem[]
  editorFiles: FileItem[]
  setFiles: (updater: FileItem[] | ((prev: FileItem[]) => FileItem[])) => void
  setActiveFile: (index: number) => void
  setFailedPlanExecution: (value: FailedPlanExecution | null) => void
  setFailedSpecExecution: (value: FailedSpecExecution | null) => void
  setQueuedChatPrompt: (value: string | null) => void
  setQueuedPlanBackfill: (value: QueuedPlanBackfill | null) => void
  setQueuedSpecBackfill: (value: QueuedSpecBackfill | null) => void
  setQueuedPlanExecutions: (value: QueuedPlanExecution[]) => void
  setQueuedSpecExecutions: (value: QueuedSpecExecution[]) => void
  copyMessageText: (text: string) => void | Promise<void>
  notify?: (kind: ToastKind, title: string, detail?: string) => void
  t: TranslateFn
}

export function useChatQueueReport({
  sessionStatus,
  runId,
  activeQueueTask,
  loading,
  sendQueue,
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
  editorFiles,
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
}: UseChatQueueReportParams) {
  const lastQueueSnapshotRef = useRef<QueueExecutionReportInput | null>(null)
  const wasQueueBusyRef = useRef(false)

  const buildQueueReportInput = useCallback((): QueueExecutionReportInput => {
    const planHints = [
      ...(failedPlanExecution
        ? [
            {
              planPath: failedPlanExecution.backfill.planPath,
              stepText: failedPlanExecution.backfill.stepText,
              stepLine: failedPlanExecution.backfill.stepLine,
            },
          ]
        : []),
      ...(queuedPlanBackfill
        ? [
            {
              planPath: queuedPlanBackfill.planPath,
              stepText: queuedPlanBackfill.stepText,
              stepLine: queuedPlanBackfill.stepLine,
            },
          ]
        : []),
      ...queuedPlanExecutions.map((item) => item.backfill),
    ]
    const specHints = [
      ...(failedSpecExecution
        ? [{ taskPath: failedSpecExecution.backfill.taskPath, taskText: failedSpecExecution.backfill.taskText }]
        : []),
      ...(queuedSpecBackfill
        ? [{ taskPath: queuedSpecBackfill.taskPath, taskText: queuedSpecBackfill.taskText }]
        : []),
      ...queuedSpecExecutions.map((item) => ({
        taskPath: item.backfill.taskPath,
        taskText: item.backfill.taskText,
      })),
    ]
    return {
      sessionStatus,
      runId,
      activeTask: activeQueueTask,
      success: queueSuccessStats,
      failure: queueFailureStats,
      recentDone: recentDoneQueueItems,
      pending: {
        planQueue: queuedPlanExecutions.length,
        specQueue: queuedSpecExecutions.length,
        sendQueue: sendQueue.length,
        planPreview: queuedPlanExecutions.slice(0, 8).map((item) => item.backfill.stepText),
        specPreview: queuedSpecExecutions.slice(0, 8).map((item) => item.backfill.taskText),
      },
      failedPlan: failedPlanExecution
        ? { stepText: failedPlanExecution.backfill.stepText, error: failedPlanExecution.error }
        : null,
      failedSpec: failedSpecExecution
        ? { taskText: failedSpecExecution.backfill.taskText, error: failedSpecExecution.error }
        : null,
      restoreHints: { plan: planHints, spec: specHints },
    }
  }, [
    activeQueueTask,
    failedPlanExecution,
    failedSpecExecution,
    queueFailureStats,
    queueSuccessStats,
    queuedPlanBackfill,
    queuedPlanExecutions,
    queuedSpecBackfill,
    queuedSpecExecutions,
    recentDoneQueueItems,
    runId,
    sendQueue.length,
    sessionStatus,
  ])

  const exportQueueReport = useCallback(() => {
    const markdown = buildQueueExecutionReportMarkdown(buildQueueReportInput())
    void copyMessageText(markdown)
    notify?.('success', t('chat.report.copiedTitle'), t('chat.report.copiedDetail'))
  }, [buildQueueReportInput, copyMessageText, notify, t])

  const saveQueueReportToWorkspace = useCallback(() => {
    const markdown = buildQueueExecutionReportMarkdown(buildQueueReportInput())
    const path = buildQueueReportPath()
    setFiles((prev) => {
      const result = upsertQueueReportFile(prev, markdown, path)
      setActiveFile(result.index)
      return result.files
    })
    notify?.('success', t('chat.report.savedTitle'), t('chat.report.savedDetail', { path }))
  }, [buildQueueReportInput, notify, setActiveFile, setFiles, t])

  const saveProofOfDoneToWorkspace = useCallback(
    (tasksPath?: string | null) => {
      const recentSpecTasks = recentDoneQueueItems.filter((row) => row.kind === 'spec').map((row) => row.text)
      const resolved = resolveProofTasksPath(editorFiles, recentSpecTasks, tasksPath)
      if (!resolved) {
        notify?.('info', t('intent.proof.noSpec.title'), t('intent.proof.noSpec.detail'))
        return
      }
      const input = {
        tasksPath: resolved,
        files: editorFiles,
        completedTasks: recentSpecTasks,
        runId,
      }
      const includeHtml = canUseEntitlement('proofHtmlExport')
      const markdown = buildProofOfDoneMarkdown(input)
      const html = includeHtml ? buildProofOfDoneHtml(input) : ''
      const paths = buildProofReportPaths(resolved)
      setFiles((prev) => {
        const result = upsertProofReportFiles(prev, markdown, html, paths, { includeHtml })
        setActiveFile(result.mdIndex)
        return result.files
      })
      notify?.(
        'success',
        t('intent.proof.saved.title'),
        includeHtml
          ? t('intent.proof.saved.detail', { path: paths.md })
          : t('intent.proof.saved.markdownOnly', { path: paths.md }),
      )
    },
    [editorFiles, notify, recentDoneQueueItems, runId, setActiveFile, setFiles, t],
  )

  const openLatestQueueReport = useCallback(() => {
    const path = findLatestReportPath(editorFiles.map((f) => ({ name: f.name, content: f.content })))
    if (!path) {
      notify?.('info', t('chat.report.noReportTitle'), t('chat.report.noReportHint'))
      return
    }
    const index = editorFiles.findIndex((f) => f.name === path)
    if (index < 0) {
      notify?.('error', t('chat.report.openFailedTitle'), t('chat.report.openFailedDetail', { path }))
      return
    }
    setActiveFile(index)
  }, [editorFiles, notify, setActiveFile, t])

  const applyRestoreFromMarkdown = useCallback(
    (markdown: string) => {
      const fileLikes = editorFiles.map((f) => ({ name: f.name, content: f.content }))
      const result = buildQueueRestoreFromReport(markdown, fileLikes)
      if (result.planItems.length === 0 && result.specItems.length === 0) {
        notify?.(
          'info',
          t('chat.report.restoreEmptyTitle'),
          result.unresolved.length ? result.unresolved.join('；') : t('chat.report.restoreNoMatch'),
        )
        return
      }
      setFailedPlanExecution(null)
      setFailedSpecExecution(null)
      const mergedPlan = mergePlanRestoreItems(queuedPlanExecutions, result.planItems, queuedPlanBackfill)
      const mergedSpec = mergeSpecRestoreItems(queuedSpecExecutions, result.specItems, queuedSpecBackfill)
      if (mergedSpec.length > 0) {
        const [first, ...rest] = mergedSpec
        setQueuedSpecExecutions(rest)
        setQueuedPlanExecutions(mergedPlan)
        setQueuedSpecBackfill(first.backfill)
        setQueuedChatPrompt(first.prompt)
      } else if (mergedPlan.length > 0) {
        const [first, ...rest] = mergedPlan
        setQueuedPlanExecutions(rest)
        setQueuedSpecExecutions([])
        setQueuedPlanBackfill(first.backfill)
        setQueuedChatPrompt(first.prompt)
      } else {
        setQueuedPlanExecutions(mergedPlan)
        setQueuedSpecExecutions(mergedSpec)
      }
      const extra = result.unresolved.length
        ? t('chat.report.restoreUnresolved', { count: result.unresolved.length })
        : ''
      const detail = t('chat.report.restoreDetail', {
        plan: result.planItems.length,
        spec: result.specItems.length,
        extra,
      })
      notify?.('success', t('chat.report.restoredTitle'), detail)
    },
    [
      editorFiles,
      notify,
      queuedPlanBackfill,
      queuedPlanExecutions,
      queuedSpecBackfill,
      queuedSpecExecutions,
      setFailedPlanExecution,
      setFailedSpecExecution,
      setQueuedChatPrompt,
      setQueuedPlanBackfill,
      setQueuedPlanExecutions,
      setQueuedSpecBackfill,
      setQueuedSpecExecutions,
      t,
    ],
  )

  const restoreQueueFromLatestReport = useCallback(() => {
    const path = findLatestReportPath(editorFiles.map((f) => ({ name: f.name, content: f.content })))
    if (!path) {
      notify?.('info', t('chat.report.noReportTitle'), t('chat.report.noReportSaveFirst'))
      return
    }
    const file = editorFiles.find((f) => f.name === path)
    if (!file) return
    applyRestoreFromMarkdown(file.content)
  }, [applyRestoreFromMarkdown, editorFiles, notify, t])

  const isQueueBusy = useMemo(() => {
    return !!(
      loading ||
      queuedChatPrompt ||
      queuedSpecBackfill ||
      queuedSpecExecutions.length > 0 ||
      queuedPlanBackfill ||
      queuedPlanExecutions.length > 0 ||
      sendQueue.length > 0 ||
      failedPlanExecution ||
      failedSpecExecution
    )
  }, [
    failedPlanExecution,
    failedSpecExecution,
    loading,
    queuedChatPrompt,
    queuedPlanBackfill,
    queuedPlanExecutions.length,
    queuedSpecBackfill,
    queuedSpecExecutions.length,
    sendQueue.length,
  ])

  useEffect(() => {
    if (isQueueBusy) {
      lastQueueSnapshotRef.current = buildQueueReportInput()
    }
  }, [buildQueueReportInput, isQueueBusy])

  useEffect(() => {
    if (wasQueueBusyRef.current && !isQueueBusy) {
      const prefs = loadQueueAutoReportPrefs()
      const snapshot = lastQueueSnapshotRef.current
      if (prefs.autoSaveOnComplete && snapshot) {
        const markdown = buildQueueExecutionReportMarkdown(snapshot)
        const path = buildQueueReportPath()
        setFiles((prev) => {
          const result = upsertQueueReportFile(prev, markdown, path)
          setActiveFile(result.index)
          return result.files
        })
        notify?.('success', t('chat.report.autoSavedTitle'), t('chat.report.autoSavedDetail', { path }))
      }
      if (prefs.notifyOnComplete) {
        notifyQueueComplete('AI IDE', t('chat.queue.completeBody'))
      }
    }
    wasQueueBusyRef.current = isQueueBusy
  }, [isQueueBusy, notify, setActiveFile, setFiles, t])

  return {
    exportQueueReport,
    saveQueueReportToWorkspace,
    saveProofOfDoneToWorkspace,
    openLatestQueueReport,
    restoreQueueFromLatestReport,
  }
}
