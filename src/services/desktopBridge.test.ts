import { describe, expect, it, vi } from 'vitest'
import type { AiIdeDesktopApi } from '../types/ai-ide-desktop'

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
    vi.stubEnv('VITE_DESKTOP_SHELL', '')
    vi.resetModules()
    const { isDesktopApp } = await import('./desktopBridge')
    expect(isDesktopApp()).toBe(true)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('falls back to vite desktop shell flag', async () => {
    stubWindow({})
    vi.stubEnv('VITE_DESKTOP_SHELL', 'true')
    vi.resetModules()
    const { isDesktopApp } = await import('./desktopBridge')
    expect(isDesktopApp()).toBe(true)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
})

describe('waitForDesktopApi', () => {
  it('resolves when preload appears after delay', async () => {
    stubWindow({})
    vi.resetModules()
    const { waitForDesktopApi } = await import('./desktopBridge')
    const pending = waitForDesktopApi(2000)
    setTimeout(() => {
      ;(window as Window & { aiIdeDesktop?: AiIdeDesktopApi }).aiIdeDesktop = {
        pickProjectFolder: () => Promise.resolve(null),
      } as AiIdeDesktopApi
    }, 100)
    const api = await pending
    expect(api?.pickProjectFolder).toBeTypeOf('function')
    vi.unstubAllGlobals()
  })
})

describe('isElectronShellBuild', () => {
  it('is false in server-like context without window', async () => {
    vi.stubGlobal('window', undefined)
    vi.stubEnv('VITE_DESKTOP_SHELL', '')
    vi.resetModules()
    const { isElectronShellBuild, isDesktopApp } = await import('./desktopBridge')
    expect(isElectronShellBuild()).toBe(false)
    expect(isDesktopApp()).toBe(false)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
})

describe('hasDesktopNativeApi', () => {
  it('requires pickProjectFolder from preload', async () => {
    stubWindow({ aiIdeDesktop: { isDesktop: true, pickProjectFolder: () => Promise.resolve(null) } })
    vi.stubEnv('VITE_DESKTOP_SHELL', 'true')
    vi.resetModules()
    const { hasDesktopNativeApi } = await import('./desktopBridge')
    expect(hasDesktopNativeApi()).toBe(true)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is false when only electron shell flag is set', async () => {
    stubWindow({})
    vi.stubEnv('VITE_DESKTOP_SHELL', 'true')
    vi.resetModules()
    const { hasDesktopNativeApi } = await import('./desktopBridge')
    expect(hasDesktopNativeApi()).toBe(false)
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
})
