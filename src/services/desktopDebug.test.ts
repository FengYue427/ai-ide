import { afterEach, describe, expect, it, vi } from 'vitest'
import { canUseDesktopDebug } from './desktopDebug'

vi.mock('./desktopBridge', () => ({
  isDesktopApp: vi.fn(),
}))

vi.mock('./localProjectService', () => ({
  getElectronRootPath: vi.fn(),
}))

import { isDesktopApp } from './desktopBridge'
import { getElectronRootPath } from './localProjectService'

describe('canUseDesktopDebug', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('is true when desktop app has bound root', () => {
    vi.mocked(isDesktopApp).mockReturnValue(true)
    vi.mocked(getElectronRootPath).mockReturnValue('/projects/demo')
    expect(canUseDesktopDebug()).toBe(true)
  })

  it('is false in browser', () => {
    vi.mocked(isDesktopApp).mockReturnValue(false)
    vi.mocked(getElectronRootPath).mockReturnValue('/projects/demo')
    expect(canUseDesktopDebug()).toBe(false)
  })
})
