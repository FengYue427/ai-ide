import type { QueuedPlanExecution } from '../store/ideStore'
import {
  parseQueuePersistencePayload,
  type QueuePersistenceLoadResult,
  serializeQueuePersistencePayload,
} from './queuePersistenceCore'

const STORAGE_KEY = 'ai-ide:queued-plan-executions'

function isValidPlanItem(item: unknown): item is QueuedPlanExecution {
  if (!item || typeof item !== 'object') return false
  const record = item as QueuedPlanExecution
  return (
    typeof record.prompt === 'string' &&
    !!record.backfill &&
    typeof record.backfill.planPath === 'string' &&
    typeof record.backfill.stepText === 'string'
  )
}

export function loadQueuedPlanExecutionsDetailed(): QueuePersistenceLoadResult<QueuedPlanExecution> {
  try {
    return parseQueuePersistencePayload(localStorage.getItem(STORAGE_KEY), isValidPlanItem)
  } catch {
    return { items: [], corrupted: true, migrated: false }
  }
}

export function loadQueuedPlanExecutions(): QueuedPlanExecution[] {
  return loadQueuedPlanExecutionsDetailed().items
}

export function saveQueuedPlanExecutions(items: QueuedPlanExecution[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, serializeQueuePersistencePayload(items))
  } catch {
    // ignore persistence errors
  }
}
