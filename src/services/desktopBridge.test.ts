import { describe, expect, it, vi } from 'vitest'

function stubWindow(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  })
}

describe('isDesktopApp', () => {
  it('detects preload bridge', async () => {
    stubWindow({ aiIdeDesktop: { isDesktop: true } })
    vi.resetModules()
    const { isDesktopApp } = await import('./desktopBridge')
    expect(isDesktopApp()).toBe(true)
    vi.unstubAllGlobals()
  })

  it('falls back to vite electron mode', async () => {
    stubWindow({})
    vi.stubEnv('MODE', 'electron')
    vi.resetModules()
    const { isDesktopApp } = await import('./desktopBridge')
    expect(isDesktopApp()).toBe(true)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
})
