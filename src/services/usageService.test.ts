import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QuotaExceededError,
  QuotaSyncError,
  ensureAIQuotaAllowed,
  fetchAIQuota,
  recordAIUsageEvent,
} from './usageService'

function createStorageMock(): Storage {
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
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
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

  it('fail-closes logged-in quota when server unreachable and no cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network')),
    )
    const quota = await fetchAIQuota('free', true)
    expect(quota.allowed).toBe(false)
  })

  it('throws QuotaSyncError when logged-in usage POST fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    )
    await expect(recordAIUsageEvent(true, 'free')).rejects.toBeInstanceOf(QuotaSyncError)
  })
})
