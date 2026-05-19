import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QuotaExceededError,
  ensureAIQuotaAllowed,
  recordAIUsageEvent,
} from './usageService'

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    key: (index) => [...store.keys()][index] ?? null,
  }
}

describe('usageService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  it('throws QuotaExceededError when guest limit reached', async () => {
    for (let i = 0; i < 200; i++) {
      await recordAIUsageEvent(false, 'free')
    }
    await expect(ensureAIQuotaAllowed('free', false)).rejects.toBeInstanceOf(QuotaExceededError)
  })

  it('allows guest under free limit', async () => {
    const quota = await ensureAIQuotaAllowed('free', false)
    expect(quota.allowed).toBe(true)
  })
})
