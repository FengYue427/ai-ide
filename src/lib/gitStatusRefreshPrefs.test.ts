import { describe, expect, it } from 'vitest'
import {
  GIT_STATUS_REFRESH_DEBOUNCE_MS,
  gitStatusRefreshDelayMs,
  normalizeGitStatusRefreshPrefs,
} from './gitStatusRefreshPrefs'

describe('gitStatusRefreshPrefs', () => {
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
