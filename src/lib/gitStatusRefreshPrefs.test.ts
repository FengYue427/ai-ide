import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GIT_STATUS_REFRESH_DEBOUNCE_MS,
  GIT_STATUS_REFRESH_PREFS_KEY,
  gitStatusRefreshDelayMs,
  loadGitStatusRefreshPrefs,
  normalizeGitStatusRefreshPrefs,
  saveGitStatusRefreshPrefs,
} from './gitStatusRefreshPrefs'

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

describe('gitStatusRefreshPrefs', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('persists manual refresh preference', () => {
    saveGitStatusRefreshPrefs({ manualRefreshOnly: true })
    expect(storage.get(GIT_STATUS_REFRESH_PREFS_KEY)).toContain('manualRefreshOnly')
    expect(loadGitStatusRefreshPrefs().manualRefreshOnly).toBe(true)
  })

  it('normalizes stored prefs', () => {
    expect(normalizeGitStatusRefreshPrefs({ manualRefreshOnly: true })).toEqual({
      manualRefreshOnly: true,
    })
    expect(normalizeGitStatusRefreshPrefs({ manualRefreshOnly: 'yes' }).manualRefreshOnly).toBe(false)
  })

  it('uses debounce for auto refresh only', () => {
    expect(gitStatusRefreshDelayMs('auto')).toBe(GIT_STATUS_REFRESH_DEBOUNCE_MS)
    expect(gitStatusRefreshDelayMs('manual')).toBe(0)
  })
})
