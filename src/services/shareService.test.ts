import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/apiUtils', () => ({
  getApiBaseUrl: vi.fn(() => ''),
  buildApiUrl: vi.fn((path: string) => path),
  apiFetch: vi.fn(),
  readJsonResponse: vi.fn(async (r: Response) => r.json()),
}))

function stubLocalStorage() {
  vi.stubGlobal('localStorage', {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return (this as { store: Record<string, string> }).store[key] ?? null
    },
    setItem(key: string, value: string) {
      ;(this as { store: Record<string, string> }).store[key] = value
    },
    removeItem(key: string) {
      delete (this as { store: Record<string, string> }).store[key]
    },
    clear() {
      ;(this as { store: Record<string, string> }).store = {}
    },
  })
}

describe('shareService', () => {
  beforeEach(() => {
    vi.resetModules()
    stubLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generateShareUrl uses API origin on desktop cross-origin shell', async () => {
    const { getApiBaseUrl } = await import('../services/apiUtils')
    vi.mocked(getApiBaseUrl).mockReturnValue('https://ai-ide-flame.vercel.app')
    vi.stubGlobal('window', { location: { href: 'file:///dist/index.html' } })
    const { generateShareUrl } = await import('./shareService')
    expect(generateShareUrl('abc12345')).toBe('https://ai-ide-flame.vercel.app/?share=abc12345')
  })

  it('createShare uses cloud slug when API succeeds', async () => {
    const { getApiBaseUrl, apiFetch } = await import('../services/apiUtils')
    vi.mocked(getApiBaseUrl).mockReturnValue('https://ai-ide-flame.vercel.app')
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ share: { slug: 'cloud01', createdAt: '2026-06-05T00:00:00.000Z' } }),
    } as Response)
    vi.stubGlobal('window', { location: { href: 'https://ai-ide-flame.vercel.app/' } })

    const { createShare } = await import('./shareService')
    const result = await createShare([{ name: 'a.ts', content: 'x', language: 'typescript' }])
    expect(result.cloud).toBe(true)
    expect(result.id).toBe('cloud01')
    expect(result.url).toContain('share=cloud01')
  })

  it('listShareHistory merges cloud summaries with local cache', async () => {
    const { apiFetch } = await import('../services/apiUtils')
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        shares: [
          { slug: 'cloudOnly', fileCount: 2, createdAt: '2026-06-05T12:00:00.000Z' },
          { slug: 'bothKinds', fileCount: 1, createdAt: '2026-06-05T11:00:00.000Z' },
        ],
      }),
    } as Response)

    localStorage.setItem(
      'ai-ide-shared-projects',
      JSON.stringify({
        bothKinds: {
          id: 'bothKinds',
          files: [{ name: 'a.ts', content: 'x', language: 'typescript' }],
          createdAt: Date.parse('2026-06-05T10:00:00.000Z'),
          cloud: false,
        },
        localOnly: {
          id: 'localOnly',
          files: [{ name: 'b.ts', content: 'y', language: 'typescript' }],
          createdAt: Date.parse('2026-06-05T13:00:00.000Z'),
          cloud: false,
        },
      }),
    )

    const { listShareHistory, getShareFileCount } = await import('./shareService')
    const history = await listShareHistory()

    expect(history.map((entry) => entry.id)).toEqual(['localOnly', 'cloudOnly', 'bothKinds'])
    const cloudOnly = history.find((entry) => entry.id === 'cloudOnly')
    expect(cloudOnly?.cloud).toBe(true)
    expect(getShareFileCount(cloudOnly!)).toBe(2)
    expect(history.find((entry) => entry.id === 'bothKinds')?.cloud).toBe(true)
  })
})
