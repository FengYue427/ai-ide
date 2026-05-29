import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueueSessionStats,
  loadQueueSessionStats,
  QUEUE_SESSION_STATS_STORAGE_KEY,
  saveQueueSessionStats,
} from './queueSessionStatsPersistenceService'

describe('queueSessionStatsPersistenceService', () => {
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
      clear: () => {
        store.clear()
      },
    })
    clearQueueSessionStats()
  })

  it('round-trips stats snapshot', () => {
    saveQueueSessionStats({
      success: { plan: 2, spec: 1 },
      failure: { plan: 0, spec: 1 },
      recentDone: [{ kind: 'plan', text: 'step A' }],
    })
    const loaded = loadQueueSessionStats()
    expect(loaded.corrupted).toBe(false)
    expect(loaded.stats).toEqual({
      success: { plan: 2, spec: 1 },
      failure: { plan: 0, spec: 1 },
      recentDone: [{ kind: 'plan', text: 'step A' }],
    })
  })

  it('returns corrupted for invalid payload', () => {
    localStorage.setItem(QUEUE_SESSION_STATS_STORAGE_KEY, '{"v":1,"items":[{"bad":true}]}')
    const loaded = loadQueueSessionStats()
    expect(loaded.stats).toBeNull()
    expect(loaded.corrupted).toBe(true)
  })

  it('caps recent done list', () => {
    const recentDone = Array.from({ length: 40 }, (_, i) => ({
      kind: 'plan' as const,
      text: `step ${i}`,
    }))
    saveQueueSessionStats({
      success: { plan: 0, spec: 0 },
      failure: { plan: 0, spec: 0 },
      recentDone,
    })
    expect(loadQueueSessionStats().stats?.recentDone).toHaveLength(30)
  })
})
