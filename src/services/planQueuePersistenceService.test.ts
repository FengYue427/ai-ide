import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadQueuedPlanExecutions,
  loadQueuedPlanExecutionsDetailed,
  saveQueuedPlanExecutions,
} from './planQueuePersistenceService'
import { QUEUE_PERSISTENCE_SCHEMA_VERSION } from './queuePersistenceCore'

describe('planQueuePersistenceService', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    })
  })

  it('saves and loads queue items', () => {
    const items = [{ prompt: 'run', backfill: { planPath: '.aide/plans/p.md', stepText: 'x' } }]
    saveQueuedPlanExecutions(items)
    expect(loadQueuedPlanExecutions()).toEqual(items)
  })

  it('returns empty on invalid payload', () => {
    localStorage.setItem('ai-ide:queued-plan-executions', '{"bad":1}')
    const result = loadQueuedPlanExecutionsDetailed()
    expect(result.items).toEqual([])
    expect(result.corrupted).toBe(true)
    expect(loadQueuedPlanExecutions()).toEqual([])
  })

  it('persists versioned envelope', () => {
    const items = [{ prompt: 'run', backfill: { planPath: '.aide/plans/p.md', stepText: 'x' } }]
    saveQueuedPlanExecutions(items)
    const raw = localStorage.getItem('ai-ide:queued-plan-executions')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw || '{}')
    expect(parsed.v).toBe(QUEUE_PERSISTENCE_SCHEMA_VERSION)
    expect(parsed.items).toEqual(items)
  })
})

