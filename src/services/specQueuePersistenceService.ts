import type { QueuedSpecExecution } from '../store/ideStore'

const STORAGE_KEY = 'ai-ide:queued-spec-executions'

export function loadQueuedSpecExecutions(): QueuedSpecExecution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.prompt === 'string' &&
        item.backfill &&
        typeof item.backfill.taskPath === 'string' &&
        typeof item.backfill.taskText === 'string' &&
        typeof item.backfill.specAcceptancePath === 'string',
    )
  } catch {
    return []
  }
}

export function saveQueuedSpecExecutions(items: QueuedSpecExecution[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore persistence errors
  }
}
