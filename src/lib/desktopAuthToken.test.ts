import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, unknown>()

vi.mock('../services/unifiedStorage', () => ({
  StorageLayer: { LOCAL: 'local' },
  unifiedStorage: {
    get: vi.fn(async (key: string, defaultValue: unknown) =>
      store.has(key) ? (store.get(key) as unknown) : defaultValue,
    ),
    set: vi.fn(async (key: string, value: unknown) => {
      if (value === null) store.delete(key)
      else store.set(key, value)
      return true
    }),
  },
}))

vi.mock('../services/apiUtils', () => ({
  getApiBaseUrl: vi.fn(() => 'https://api.example.com'),
}))

describe('desktopAuthToken', () => {
  beforeEach(() => {
    store.clear()
    vi.resetModules()
  })

  it('persists bearer token when cross-origin API is configured', async () => {
    const mod = await import('./desktopAuthToken')
    expect(mod.needsCrossOriginAuth()).toBe(true)
    await mod.persistAuthToken('jwt-test')
    expect(await mod.getStoredAuthToken()).toBe('jwt-test')
    await mod.clearAuthToken()
    expect(await mod.getStoredAuthToken()).toBeNull()
  })
})
