import type { QueuedPlanExecution } from '../store/ideStore'

const STORAGE_KEY = 'ai-ide:queued-plan-executions'

export function loadQueuedPlanExecutions(): QueuedPlanExecution[] {
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
        typeof item.backfill.planPath === 'string' &&
        typeof item.backfill.stepText === 'string',
    )
  } catch {
    return []
  }
}

export function saveQueuedPlanExecutions(items: QueuedPlanExecution[]): void {
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

