import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/apiUtils', () => ({
  getApiBaseUrl: vi.fn(() => ''),
  buildApiUrl: vi.fn((path: string) => path),
}))

describe('appOrigin', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { getApiBaseUrl } = await import('../services/apiUtils')
    vi.mocked(getApiBaseUrl).mockReturnValue('')
    vi.stubGlobal('window', {
      location: { origin: 'file://' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('prefers VITE_API_BASE_URL over file:// origin', async () => {
    const { getApiBaseUrl } = await import('../services/apiUtils')
    vi.mocked(getApiBaseUrl).mockReturnValue('https://ai-ide-flame.vercel.app')
    const { getPublicAppOrigin, getShareableAppOrigin } = await import('./appOrigin')
    expect(getPublicAppOrigin()).toBe('https://ai-ide-flame.vercel.app')
    expect(getShareableAppOrigin()).toBe('https://ai-ide-flame.vercel.app')
  })

  it('uses window origin on same-origin web builds', async () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://ai-ide-flame.vercel.app' },
    })
    const { getPublicAppOrigin } = await import('./appOrigin')
    expect(getPublicAppOrigin()).toBe('https://ai-ide-flame.vercel.app')
  })

  it('resolveAppLogo uses public logo.svg', async () => {
    const { resolveAppLogo } = await import('./appOrigin')
    expect(resolveAppLogo()).toMatch(/logo\.svg$/)
  })
})
