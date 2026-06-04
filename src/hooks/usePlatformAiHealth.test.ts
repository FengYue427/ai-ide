import { describe, expect, it, vi, afterEach } from 'vitest'
import { fetchPlatformAiHealth } from './usePlatformAiHealth'

describe('fetchPlatformAiHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses configured platform AI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ platformAi: { configured: true, provider: 'deepseek' } }),
      })),
    )
    await expect(fetchPlatformAiHealth()).resolves.toEqual({
      status: 'ready',
      configured: true,
      provider: 'deepseek',
      plugins: { publishEnabled: false, officialKeyConfigured: false },
    })
  })

  it('parses plugins block from health', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          platformAi: { configured: true },
          plugins: { publishEnabled: true, officialKeyConfigured: true },
        }),
      })),
    )
    const result = await fetchPlatformAiHealth()
    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.plugins.publishEnabled).toBe(true)
      expect(result.plugins.officialKeyConfigured).toBe(true)
    }
  })

  it('returns unreachable on network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    await expect(fetchPlatformAiHealth()).resolves.toEqual({
      status: 'unreachable',
      plugins: { publishEnabled: false, officialKeyConfigured: false },
    })
  })
})
