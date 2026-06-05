import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  disableAideRuntimeUiForSession,
  enableAideRuntimeUiForSession,
  isAideRuntimeUiEnabled,
} from './aideRuntimeUi'

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

describe('aideRuntimeUi', () => {
  beforeEach(() => {
    storage.clear()
    delete import.meta.env.VITE_AIDE_RUNTIME_UI
  })

  it('is off by default in test runtime', () => {
    expect(isAideRuntimeUiEnabled()).toBe(false)
  })

  it('enables via session localStorage', () => {
    enableAideRuntimeUiForSession()
    expect(isAideRuntimeUiEnabled()).toBe(true)
    disableAideRuntimeUiForSession()
    expect(isAideRuntimeUiEnabled()).toBe(false)
  })

  it('disables via env false even with session flag', () => {
    enableAideRuntimeUiForSession()
    import.meta.env.VITE_AIDE_RUNTIME_UI = 'false'
    expect(isAideRuntimeUiEnabled()).toBe(false)
  })
})
