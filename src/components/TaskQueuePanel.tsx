import { memo } from 'react'
import { useI18n } from '../i18n'
import type {
  FailedPlanExecution,
  FailedSpecExecution,
  LastGroundingBlock,
  QueuedPlanExecution,
  QueuedSpecBackfill,
  QueuedSpecExecution,
  RecentDoneQueueItem,
} from '../store/ideStore'
import type { ChatSessionStatus } from '../services/chatSessionOrchestrator'
import type { RuntimeQueuePauseState } from '../services/runtime/runtimeQueuePause'
import { QueuePreviewList } from './QueuePreviewList'
import { SpecVerificationQueueList } from './SpecVerificationQueueList'
import { IntentGroundingBanner } from './intent/IntentGroundingBanner'
import { IntentDemoVerifyBanner } from './IntentDemoVerifyBanner'

export type { FailedPlanExecution, FailedSpecExecution, RecentDoneQueueItem } from '../store/ideStore'

export interface TaskQueuePanelProps {
  sessionStatus: ChatSessionStatus
  runId: string | null
  activeQueueTask: string | null
  queuedChatPrompt: string | null
  queuedSpecBackfill: QueuedSpecBackfill | null
  verifyingSpecBackfill: QueuedSpecBackfill | null
  lastGroundingBlock: LastGroundingBlock | null
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
  onSaveProof?: () => void
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
  onDismissGroundingBlock?: () => void
  showIntentDemoVerifyBanner?: boolean
  onMarkIntentDemoComplete?: () => void
  onOpenIntentGraph?: () => void
}

export const TaskQueuePanel = memo(function TaskQueuePanel({
  sessionStatus,
  runId,
  activeQueueTask,
  queuedChatPrompt,
  queuedPlanExecutions,
  queuedSpecExecutions,
  sendQueue,
  queueFailureStats,
  queueSuccessStats,
  recentDoneQueueItems,
  failedPlanExecution,
  failedSpecExecution,
  runtimeQueuePause,
  onResumeRuntimeQueue,
  onExportReport,
  onSaveReport,
  onSaveProof,
  onOpenLatestReport,
  onRestoreFromLatestReport,
  onResetFailureStats,
  onResetSuccessStats,
  onClearSpecQueue,
  onClearPlanQueue,
  onRetryFailedPlan,
  onSkipFailedPlan,
  onRetryFailedSpec,
  onSkipFailedSpec,
  queuedSpecBackfill,
  verifyingSpecBackfill,
  lastGroundingBlock,
  onDismissGroundingBlock,
  showIntentDemoVerifyBanner = false,
  onMarkIntentDemoComplete,
  onOpenIntentGraph,
}: TaskQueuePanelProps) {
  const { t } = useI18n()

  const planPreviewLabels = queuedPlanExecutions.map((item) => item.backfill.stepText)
  const specPreviewLabels = queuedSpecExecutions.map((item) => item.backfill.taskText)

  return (
    <div
      style={{
        margin: '10px 0',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{t('queue.panel.title')}</div>
        {onOpenIntentGraph ? (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: 11 }}
            data-testid="queue-open-intent-graph"
            onClick={onOpenIntentGraph}
          >
            {t('intent.graph.openShort')}
          </button>
        ) : null}
      </div>
      {runtimeQueuePause ? (
        <div
          data-testid="runtime-queue-paused-banner"
          style={{
            marginBottom: 8,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--danger-color, #c44)',
            background: 'rgba(239, 68, 68, 0.08)',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--danger-color, #c44)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('runtime.queuePaused.title')}</div>
          <div>{runtimeQueuePause.reason}</div>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="runtime-queue-resume"
            style={{ marginTop: 8, padding: '4px 8px', fontSize: 11 }}
            onClick={onResumeRuntimeQueue}
          >
            {t('runtime.queuePaused.resume')}
          </button>
        </div>
      ) : null}
      {lastGroundingBlock ? (
        <IntentGroundingBanner
          block={lastGroundingBlock}
          onDismiss={onDismissGroundingBlock}
        />
      ) : null}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {t('queue.panel.sessionStatus', { status: sessionStatus })}
        {runId ? ` · ${runId}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onExportReport}>
          {t('queue.panel.copyReport')}
        </button>
        <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onSaveReport}>
          {t('queue.panel.saveReport')}
        </button>
        {onSaveProof ? (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11 }}
            data-testid="queue-save-proof"
            onClick={onSaveProof}
          >
            {t('intent.proof.saveAction')}
          </button>
        ) : null}
        <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onOpenLatestReport}>
          {t('queue.panel.openLatestReport')}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: 11 }}
          onClick={onRestoreFromLatestReport}
        >
          {t('queue.panel.restoreFromLatest')}
        </button>
      </div>
      {activeQueueTask ? (
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
          {t('queue.panel.activeTask', { task: activeQueueTask })}
        </div>
      ) : null}
      {queueFailureStats.plan > 0 || queueFailureStats.spec > 0 ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--danger-color)' }}>
            {t('queue.panel.failureStats', { plan: queueFailureStats.plan, spec: queueFailureStats.spec })}
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onResetFailureStats}>
            {t('queue.panel.resetFailure')}
          </button>
        </div>
      ) : null}
      {queueSuccessStats.plan > 0 || queueSuccessStats.spec > 0 ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {t('queue.panel.successStats', { plan: queueSuccessStats.plan, spec: queueSuccessStats.spec })}
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onResetSuccessStats}>
            {t('queue.panel.resetSuccess')}
          </button>
        </div>
      ) : null}
      {recentDoneQueueItems.length > 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
          {t('queue.panel.recentDone')}
          {recentDoneQueueItems.slice(0, 3).map((item, index) => (
            <span key={`done-${index}`}>
              {' '}
              [{item.kind === 'plan' ? 'Plan' : 'Spec'}]
              {item.text.slice(0, 18)}
              {item.text.length > 18 ? '…' : ''}
            </span>
          ))}
        </div>
      ) : null}
      {queuedChatPrompt ? (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
          {t('queue.panel.waitingPrompt', {
            text: queuedChatPrompt.slice(0, 60) + (queuedChatPrompt.length > 60 ? '…' : ''),
          })}
        </div>
      ) : null}
      {showIntentDemoVerifyBanner && onMarkIntentDemoComplete ? (
        <IntentDemoVerifyBanner onMarkLevelComplete={onMarkIntentDemoComplete} />
      ) : null}
      {queuedSpecExecutions.length > 0 || queuedSpecBackfill || verifyingSpecBackfill || failedSpecExecution ? (
        <SpecVerificationQueueList
          activeBackfill={queuedSpecBackfill}
          verifyingBackfill={verifyingSpecBackfill}
          activeTaskLabel={activeQueueTask}
          pending={queuedSpecExecutions}
          failed={failedSpecExecution}
          recentPassed={recentDoneQueueItems}
        />
      ) : null}
      {queuedSpecExecutions.length > 0 || queuedPlanExecutions.length > 0 ? (
        <div style={{ marginBottom: 6 }}>
          <QueuePreviewList kind="spec" labels={specPreviewLabels} />
          <QueuePreviewList kind="plan" labels={planPreviewLabels} />
        </div>
      ) : null}
      {queuedSpecExecutions.length > 0 ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('queue.panel.specQueueCount', { count: queuedSpecExecutions.length })}
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onClearSpecQueue}>
            {t('queue.panel.clearSpec')}
          </button>
        </div>
      ) : null}
      {queuedPlanExecutions.length > 0 ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('queue.panel.planQueueCount', { count: queuedPlanExecutions.length })}
          </div>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onClearPlanQueue}>
            {t('queue.panel.clearPlan')}
          </button>
        </div>
      ) : null}
      {failedPlanExecution ? (
        <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--danger-color)' }}>
          {t('queue.panel.planFailed', { step: failedPlanExecution.backfill.stepText, error: failedPlanExecution.error })}
          <div style={{ display: 'inline-flex', gap: 8, marginLeft: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onRetryFailedPlan}>
              {t('queue.panel.retryPlan')}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onSkipFailedPlan}>
              {t('queue.panel.skipContinue')}
            </button>
          </div>
        </div>
      ) : null}
      {failedSpecExecution ? (
        <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--danger-color)' }}>
          {t('queue.panel.specFailed', { task: failedSpecExecution.backfill.taskText, error: failedSpecExecution.error })}
          <div style={{ display: 'inline-flex', gap: 8, marginLeft: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onRetryFailedSpec}>
              {t('queue.panel.retrySpec')}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onSkipFailedSpec}>
              {t('queue.panel.skipContinue')}
            </button>
          </div>
        </div>
      ) : null}
      {sendQueue.length > 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t('queue.panel.sendQueue')}
          {sendQueue.slice(0, 3).map((item, idx) => (
            <span key={idx}>
              [{idx + 1}] {item.text.slice(0, 28)}
              {item.text.length > 28 ? '…' : ''}&nbsp;
            </span>
          ))}
          {sendQueue.length > 3 ? t('queue.panel.sendQueueMore', { count: sendQueue.length - 3 }) : ''}
        </div>
      ) : null}
    </div>
  )
})
