import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readActivityLineCollapsed, writeActivityLineCollapsed } from './activityLinePrefs'

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

describe('activityLinePrefs', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('defaults to collapsed', () => {
    expect(readActivityLineCollapsed()).toBe(true)
  })

  it('persists expanded state', () => {
    writeActivityLineCollapsed(false)
    expect(readActivityLineCollapsed()).toBe(false)
  })
})
