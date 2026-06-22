import { memo } from 'react'
import { useI18n, type TranslationKey } from '../i18n'
import type { QueuedSpecBackfill, QueuedSpecExecution } from '../store/ideStore'
import type { FailedSpecExecution, RecentDoneQueueItem } from './TaskQueuePanel'

export type SpecQueueStage = 'pending' | 'running' | 'verify' | 'passed' | 'failed'

export interface SpecQueueStageItem {
  id: string
  taskText: string
  taskPath: string
  stage: SpecQueueStage
  detail?: string
}

interface SpecVerificationQueueListProps {
  activeBackfill: QueuedSpecBackfill | null
  verifyingBackfill: QueuedSpecBackfill | null
  activeTaskLabel: string | null
  pending: QueuedSpecExecution[]
  failed: FailedSpecExecution | null
  recentPassed: RecentDoneQueueItem[]
}

const STAGE_I18N: Record<SpecQueueStage, TranslationKey> = {
  pending: 'intent.queue.stage.pending',
  running: 'intent.queue.stage.running',
  verify: 'intent.queue.stage.verify',
  passed: 'intent.queue.stage.passed',
  failed: 'intent.queue.stage.failed',
}

function stageLabel(stage: SpecQueueStage, t: (key: TranslationKey) => string): string {
  return t(STAGE_I18N[stage])
}

export const SpecVerificationQueueList = memo(function SpecVerificationQueueList({
  activeBackfill,
  verifyingBackfill,
  activeTaskLabel,
  pending,
  failed,
  recentPassed,
}: SpecVerificationQueueListProps) {
  const { t } = useI18n()

  const items: SpecQueueStageItem[] = []

  for (const done of recentPassed.filter((row) => row.kind === 'spec').slice(0, 2)) {
    items.push({
      id: `passed-${done.text}`,
      taskText: done.text,
      taskPath: '',
      stage: 'passed',
    })
  }

  if (failed) {
    items.push({
      id: 'failed-current',
      taskText: failed.backfill.taskText,
      taskPath: failed.backfill.taskPath,
      stage: 'failed',
      detail: failed.error,
    })
  } else if (verifyingBackfill) {
    items.push({
      id: 'verify-current',
      taskText: verifyingBackfill.taskText,
      taskPath: verifyingBackfill.taskPath,
      stage: 'verify',
    })
  } else if (activeBackfill || activeTaskLabel) {
    items.push({
      id: 'running-current',
      taskText: activeBackfill?.taskText ?? activeTaskLabel ?? '',
      taskPath: activeBackfill?.taskPath ?? '',
      stage: 'running',
    })
  }

  for (const [index, row] of pending.entries()) {
    items.push({
      id: `pending-${index}-${row.backfill.taskText}`,
      taskText: row.backfill.taskText,
      taskPath: row.backfill.taskPath,
      stage: 'pending',
    })
  }

  if (items.length === 0) return null

  return (
    <div className="intent-spec-queue" data-testid="intent-spec-queue">
      <div className="intent-spec-queue__title">{t('intent.queue.title')}</div>
      <ul className="intent-spec-queue__list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`intent-spec-queue__item intent-spec-queue__item--${item.stage}`}
            data-testid={`intent-queue-stage-${item.stage}`}
          >
            <span className="intent-spec-queue__badge">{stageLabel(item.stage, t)}</span>
            <span className="intent-spec-queue__text">{item.taskText}</span>
            {item.detail ? <span className="intent-spec-queue__detail">{item.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
})
