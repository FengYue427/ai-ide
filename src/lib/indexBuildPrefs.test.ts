import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getIndexBuildModePreference,
  setIndexBuildModePreference,
} from './indexBuildPrefs'

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

describe('indexBuildPrefs', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('defaults to auto', () => {
    expect(getIndexBuildModePreference()).toBe('auto')
  })

  it('persists worker and sync modes', () => {
    setIndexBuildModePreference('worker')
    expect(getIndexBuildModePreference()).toBe('worker')
    setIndexBuildModePreference('sync')
    expect(getIndexBuildModePreference()).toBe('sync')
  })
})
