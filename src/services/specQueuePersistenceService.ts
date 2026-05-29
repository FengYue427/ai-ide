import type { QueuedSpecExecution } from '../store/ideStore'
import {
  parseQueuePersistencePayload,
  type QueuePersistenceLoadResult,
  serializeQueuePersistencePayload,
} from './queuePersistenceCore'

const STORAGE_KEY = 'ai-ide:queued-spec-executions'

function isValidSpecItem(item: unknown): item is QueuedSpecExecution {
  if (!item || typeof item !== 'object') return false
  const record = item as QueuedSpecExecution
  return (
    typeof record.prompt === 'string' &&
    !!record.backfill &&
    typeof record.backfill.taskPath === 'string' &&
    typeof record.backfill.taskText === 'string' &&
    typeof record.backfill.specAcceptancePath === 'string'
  )
}

export function loadQueuedSpecExecutionsDetailed(): QueuePersistenceLoadResult<QueuedSpecExecution> {
  try {
    return parseQueuePersistencePayload(localStorage.getItem(STORAGE_KEY), isValidSpecItem)
  } catch {
    return { items: [], corrupted: true, migrated: false }
  }
}

export function loadQueuedSpecExecutions(): QueuedSpecExecution[] {
  return loadQueuedSpecExecutionsDetailed().items
}

export function saveQueuedSpecExecutions(items: QueuedSpecExecution[]): void {
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
