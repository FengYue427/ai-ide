import { describe, expect, it } from 'vitest'
import { GIT_STATUS_REFRESH_DEBOUNCE_MS } from '../lib/gitStatusRefreshPrefs'
import { resolveGitStatusRefreshDelay, shouldRunGitStatusRefresh } from './useGitStatus'

describe('useGitStatus refresh policy', () => {
  it('skips auto refresh when manual-only without trigger', () => {
    expect(
      shouldRunGitStatusRefresh({
        gitManualRefreshOnly: true,
        fsJustReady: false,
        manualTrigger: false,
      }),
    ).toBe(false)
  })

  it('runs refresh when manual nonce bumps under manual-only', () => {
    expect(
      shouldRunGitStatusRefresh({
        gitManualRefreshOnly: true,
        fsJustReady: false,
        manualTrigger: true,
      }),
    ).toBe(true)
  })

  it('debounces auto refresh but not manual trigger', () => {
    expect(resolveGitStatusRefreshDelay(false, false)).toBe(GIT_STATUS_REFRESH_DEBOUNCE_MS)
    expect(resolveGitStatusRefreshDelay(true, false)).toBe(0)
    expect(resolveGitStatusRefreshDelay(false, true)).toBe(0)
  })
})
