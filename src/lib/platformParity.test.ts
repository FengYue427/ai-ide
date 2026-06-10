import { describe, expect, it, vi } from 'vitest'
import {
  getPlatformSurface,
  hasNativeProjectRoot,
  isRuntimeEnvironmentReady,
  resolveRuntimeStatusKind,
  supportsCapability,
} from './platformParity'

vi.mock('../services/desktopBridge', () => ({
  isDesktopApp: vi.fn(() => false),
}))

vi.mock('../services/localProjectService', () => ({
  getElectronRootPath: vi.fn(() => null),
}))

describe('platformParity', () => {
  it('defaults to browser surface', () => {
    expect(getPlatformSurface()).toBe('browser')
  })

  it('uses WebContainer readiness in browser', () => {
    expect(isRuntimeEnvironmentReady(false)).toBe(false)
    expect(isRuntimeEnvironmentReady(true)).toBe(true)
    expect(resolveRuntimeStatusKind(true)).toBe('webReady')
    expect(resolveRuntimeStatusKind(false)).toBe('loading')
  })

  it('reports shell hooks desktop-only', () => {
    expect(supportsCapability('runtimeShellHooks')).toBe(false)
  })
})

describe('platformParity desktop', () => {
  it('prefers native folder over WebContainer', async () => {
    const bridge = await import('../services/desktopBridge')
    const local = await import('../services/localProjectService')
    vi.mocked(bridge.isDesktopApp).mockReturnValue(true)
    vi.mocked(local.getElectronRootPath).mockReturnValue('/tmp/project')

    expect(getPlatformSurface()).toBe('desktop')
    expect(hasNativeProjectRoot()).toBe(true)
    expect(isRuntimeEnvironmentReady(false)).toBe(true)
    expect(resolveRuntimeStatusKind(false)).toBe('desktopReady')
    expect(supportsCapability('runtimeShellHooks')).toBe(true)
  })
})
