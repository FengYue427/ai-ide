export const QUEUE_PERSISTENCE_SCHEMA_VERSION = 1

export interface QueuePersistenceEnvelope<T> {
  v: number
  items: T[]
}

export interface QueuePersistenceLoadResult<T> {
  items: T[]
  corrupted: boolean
  migrated: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function parseQueuePersistencePayload<T>(
  raw: string | null,
  validateItem: (item: unknown) => item is T,
): QueuePersistenceLoadResult<T> {
  if (!raw) return { items: [], corrupted: false, migrated: false }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const items = parsed.filter(validateItem)
      return { items, corrupted: items.length !== parsed.length, migrated: true }
    }
    if (isRecord(parsed) && Array.isArray(parsed.items)) {
      const version = typeof parsed.v === 'number' ? parsed.v : 0
      if (version > QUEUE_PERSISTENCE_SCHEMA_VERSION) {
        return { items: [], corrupted: true, migrated: false }
      }
      const items = parsed.items.filter(validateItem)
      const corrupted = items.length !== parsed.items.length
      return { items, corrupted, migrated: version < QUEUE_PERSISTENCE_SCHEMA_VERSION }
    }
    return { items: [], corrupted: true, migrated: false }
  } catch {
    return { items: [], corrupted: true, migrated: false }
  }
}

export function serializeQueuePersistencePayload<T>(items: T[]): string {
  const envelope: QueuePersistenceEnvelope<T> = {
    v: QUEUE_PERSISTENCE_SCHEMA_VERSION,
    items,
  }
  return JSON.stringify(envelope)
}
