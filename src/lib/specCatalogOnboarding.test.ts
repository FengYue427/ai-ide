import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissSpecHooksGuide, shouldShowSpecHooksGuide } from './specCatalogOnboarding'

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

describe('specCatalogOnboarding', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('shows hooks guide until dismissed', () => {
    expect(shouldShowSpecHooksGuide()).toBe(true)
    dismissSpecHooksGuide()
    expect(shouldShowSpecHooksGuide()).toBe(false)
  })
})
