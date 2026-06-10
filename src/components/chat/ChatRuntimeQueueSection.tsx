import { memo } from 'react'
import { useI18n } from '../../i18n'
import type { QueuedPlanExecution, QueuedSpecExecution } from '../../store/ideStore'
import type { ChatSessionStatus } from '../../services/chatSessionOrchestrator'
import type { RuntimeQueuePauseState } from '../../services/runtime/runtimeQueuePause'
import {
  TaskQueuePanel,
  type FailedPlanExecution,
  type FailedSpecExecution,
  type RecentDoneQueueItem,
} from '../TaskQueuePanel'

export interface ChatRuntimeQueueSectionProps {
  loading: boolean
  sessionStatus: ChatSessionStatus
  runId: string | null
  activeQueueTask: string | null
  queuedChatPrompt: string | null
  queuedPlanExecutions: QueuedPlanExecution[]
  queuedSpecExecutions: QueuedSpecExecution[]
  sendQueue: Array<{ text: string }>
  queueFailureStats: { plan: number; spec: number }
  queueSuccessStats: { plan: number; spec: number }
  recentDoneQueueItems: RecentDoneQueueItem[]
  failedPlanExecution: FailedPlanExecution | null
  failedSpecExecution: FailedSpecExecution | null
  runtimeQueuePause: RuntimeQueuePauseState | null
  onResumeRuntimeQueue: () => void
  onExportReport: () => void
  onSaveReport: () => void
  onOpenLatestReport: () => void
  onRestoreFromLatestReport: () => void
  onResetFailureStats: () => void
  onResetSuccessStats: () => void
  onClearSpecQueue: () => void
  onClearPlanQueue: () => void
  onRetryFailedPlan: () => void
  onSkipFailedPlan: () => void
  onRetryFailedSpec: () => void
  onSkipFailedSpec: () => void
}

function shouldShowQueueSection(props: ChatRuntimeQueueSectionProps): boolean {
  const hasQueue =
    Boolean(props.runtimeQueuePause) ||
    Boolean(props.queuedChatPrompt) ||
    props.queuedPlanExecutions.length > 0 ||
    props.queuedSpecExecutions.length > 0 ||
    props.sendQueue.length > 0
  if (!props.loading && hasQueue) return true
  return props.loading && props.sendQueue.length > 0
}

export const ChatRuntimeQueueSection = memo(function ChatRuntimeQueueSection(props: ChatRuntimeQueueSectionProps) {
  const { t } = useI18n()
  if (!shouldShowQueueSection(props)) return null

  return (
    <section className="chat-runtime-queue-section" aria-label={t('queue.panel.title')}>
      <TaskQueuePanel
        sessionStatus={props.sessionStatus}
        runId={props.runId}
        activeQueueTask={props.activeQueueTask}
        queuedChatPrompt={props.queuedChatPrompt}
        queuedPlanExecutions={props.queuedPlanExecutions}
        queuedSpecExecutions={props.queuedSpecExecutions}
        sendQueue={props.sendQueue}
        queueFailureStats={props.queueFailureStats}
        queueSuccessStats={props.queueSuccessStats}
        recentDoneQueueItems={props.recentDoneQueueItems}
        failedPlanExecution={props.failedPlanExecution}
        failedSpecExecution={props.failedSpecExecution}
        runtimeQueuePause={props.runtimeQueuePause}
        onResumeRuntimeQueue={props.onResumeRuntimeQueue}
        onExportReport={props.onExportReport}
        onSaveReport={props.onSaveReport}
        onOpenLatestReport={props.onOpenLatestReport}
        onRestoreFromLatestReport={props.onRestoreFromLatestReport}
        onResetFailureStats={props.onResetFailureStats}
        onResetSuccessStats={props.onResetSuccessStats}
        onClearSpecQueue={props.onClearSpecQueue}
        onClearPlanQueue={props.onClearPlanQueue}
        onRetryFailedPlan={props.onRetryFailedPlan}
        onSkipFailedPlan={props.onSkipFailedPlan}
        onRetryFailedSpec={props.onRetryFailedSpec}
        onSkipFailedSpec={props.onSkipFailedSpec}
      />
    </section>
  )
})
