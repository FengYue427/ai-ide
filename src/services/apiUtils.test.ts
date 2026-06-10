import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('apiUtils', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
  })

  it('buildApiUrl prefixes configured API origin', async () => {
    vi.doMock('../lib/desktopAuthToken', () => ({
      needsCrossOriginAuth: () => true,
      getStoredAuthToken: async () => null,
    }))
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    const { buildApiUrl } = await import('./apiUtils')
    expect(buildApiUrl('/api/health')).toBe('https://api.example.com/api/health')
  })

  it('apiFetch injects Authorization bearer for cross-origin desktop', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.doMock('../lib/desktopAuthToken', () => ({
      needsCrossOriginAuth: () => true,
      getStoredAuthToken: async () => 'secret-jwt',
    }))
    const { apiFetch } = await import('./apiUtils')
    await apiFetch('/api/subscription', { credentials: 'include' })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/subscription',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.any(Headers),
      }),
    )
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer secret-jwt')
  })
})
