import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadQueuedPlanExecutions, saveQueuedPlanExecutions } from './planQueuePersistenceService'

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
    expect(loadQueuedPlanExecutions()).toEqual([])
  })
})

