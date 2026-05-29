import {
  parseQueuePersistencePayload,
  serializeQueuePersistencePayload,
} from './queuePersistenceCore'

export interface QueueSessionStatsSnapshot {
  success: { plan: number; spec: number }
  failure: { plan: number; spec: number }
  recentDone: Array<{ kind: 'plan' | 'spec'; text: string }>
}

export const QUEUE_SESSION_STATS_STORAGE_KEY = 'ai-ide:queue-session-stats'
export const MAX_RECENT_DONE_ITEMS = 30

export interface QueueSessionStatsLoadResult {
  stats: QueueSessionStatsSnapshot | null
  corrupted: boolean
  migrated: boolean
}

function isStatsSnapshot(value: unknown): value is QueueSessionStatsSnapshot {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const success = record.success
  const failure = record.failure
  const recentDone = record.recentDone
  if (!success || typeof success !== 'object' || !failure || typeof failure !== 'object') return false
  const s = success as Record<string, unknown>
  const f = failure as Record<string, unknown>
  if (typeof s.plan !== 'number' || typeof s.spec !== 'number') return false
  if (typeof f.plan !== 'number' || typeof f.spec !== 'number') return false
  if (!Array.isArray(recentDone)) return false
  return recentDone.every(
    (item) =>
      !!item &&
      typeof item === 'object' &&
      ((item as { kind?: string }).kind === 'plan' || (item as { kind?: string }).kind === 'spec') &&
      typeof (item as { text?: string }).text === 'string',
  )
}

function normalizeSnapshot(snapshot: QueueSessionStatsSnapshot): QueueSessionStatsSnapshot {
  return {
    success: {
      plan: Math.max(0, Math.floor(snapshot.success.plan)),
      spec: Math.max(0, Math.floor(snapshot.success.spec)),
    },
    failure: {
      plan: Math.max(0, Math.floor(snapshot.failure.plan)),
      spec: Math.max(0, Math.floor(snapshot.failure.spec)),
    },
    recentDone: snapshot.recentDone.slice(0, MAX_RECENT_DONE_ITEMS),
  }
}

export function loadQueueSessionStats(): QueueSessionStatsLoadResult {
  if (typeof localStorage === 'undefined') {
    return { stats: null, corrupted: false, migrated: false }
  }
  let raw: string | null = null
  try {
    raw = localStorage.getItem(QUEUE_SESSION_STATS_STORAGE_KEY)
  } catch {
    return { stats: null, corrupted: true, migrated: false }
  }
  const { items, corrupted, migrated } = parseQueuePersistencePayload(raw, isStatsSnapshot)
  const stats = items[0] ? normalizeSnapshot(items[0]) : null
  return { stats, corrupted, migrated }
}

export function saveQueueSessionStats(snapshot: QueueSessionStatsSnapshot): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      QUEUE_SESSION_STATS_STORAGE_KEY,
      serializeQueuePersistencePayload([normalizeSnapshot(snapshot)]),
    )
  } catch {
    // ignore quota errors
  }
}

export function clearQueueSessionStats(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(QUEUE_SESSION_STATS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
