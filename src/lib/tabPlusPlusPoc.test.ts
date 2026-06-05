import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disableTabPlusPlusPocForSession,
  enableTabPlusPlusPocForSession,
  isTabPlusPlusPocEnabled,
} from './tabPlusPlusPoc'

const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
})

describe('tabPlusPlusPoc', () => {
  beforeEach(() => {
    storage.clear()
    delete import.meta.env.VITE_TAB_PLUS_PLUS_POC
  })

  it('is off by default in test runtime', () => {
    expect(isTabPlusPlusPocEnabled()).toBe(false)
  })

  it('enables via env true only', () => {
    import.meta.env.VITE_TAB_PLUS_PLUS_POC = 'true'
    expect(isTabPlusPlusPocEnabled()).toBe(true)
  })

  it('disables via env false even with session flag', () => {
    enableTabPlusPlusPocForSession()
    import.meta.env.VITE_TAB_PLUS_PLUS_POC = 'false'
    expect(isTabPlusPlusPocEnabled()).toBe(false)
  })

  it('enables via session localStorage', () => {
    enableTabPlusPlusPocForSession()
    expect(isTabPlusPlusPocEnabled()).toBe(true)
    disableTabPlusPlusPocForSession()
    expect(isTabPlusPlusPocEnabled()).toBe(false)
  })
})
