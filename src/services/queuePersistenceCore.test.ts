import { describe, expect, it } from 'vitest'
import {
  parseQueuePersistencePayload,
  QUEUE_PERSISTENCE_SCHEMA_VERSION,
  serializeQueuePersistencePayload,
} from './queuePersistenceCore'

type Item = { id: string }

function isItem(value: unknown): value is Item {
  return isRecord(value) && typeof value.id === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

describe('queuePersistenceCore', () => {
  it('round-trips versioned envelope', () => {
    const items: Item[] = [{ id: 'a' }]
    const raw = serializeQueuePersistencePayload(items)
    const result = parseQueuePersistencePayload(raw, isItem)
    expect(result.items).toEqual(items)
    expect(result.corrupted).toBe(false)
    expect(result.migrated).toBe(false)
  })

  it('migrates legacy array payload', () => {
    const raw = JSON.stringify([{ id: 'legacy' }, { bad: true }])
    const result = parseQueuePersistencePayload(raw, isItem)
    expect(result.items).toEqual([{ id: 'legacy' }])
    expect(result.migrated).toBe(true)
    expect(result.corrupted).toBe(true)
  })

  it('returns empty on corrupt json', () => {
    const result = parseQueuePersistencePayload('{', isItem)
    expect(result.items).toEqual([])
    expect(result.corrupted).toBe(true)
  })

  it('rejects future schema version', () => {
    const raw = JSON.stringify({ v: QUEUE_PERSISTENCE_SCHEMA_VERSION + 1, items: [{ id: 'x' }] })
    const result = parseQueuePersistencePayload(raw, isItem)
    expect(result.items).toEqual([])
    expect(result.corrupted).toBe(true)
  })
})
