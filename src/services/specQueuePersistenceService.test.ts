import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadQueuedSpecExecutions, saveQueuedSpecExecutions } from './specQueuePersistenceService'

describe('specQueuePersistenceService', () => {
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

  it('saves and loads spec queue items', () => {
    const items = [
      {
        prompt: 'run spec task',
        backfill: {
          taskPath: '.aide/specs/a/tasks.md',
          taskText: 'do x',
          specAcceptancePath: '.aide/specs/a/acceptance.md',
        },
      },
    ]
    saveQueuedSpecExecutions(items)
    expect(loadQueuedSpecExecutions()).toEqual(items)
  })

  it('returns empty on invalid payload', () => {
    localStorage.setItem('ai-ide:queued-spec-executions', '{"bad":1}')
    expect(loadQueuedSpecExecutions()).toEqual([])
  })
})
