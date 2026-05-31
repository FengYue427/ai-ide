import { describe, expect, it } from 'vitest'
import { GIT_STATUS_PERF_HINT_THRESHOLD, shouldShowGitStatusPerfHint } from './gitStatusPerfHint'

describe('shouldShowGitStatusPerfHint', () => {
  it('shows hint at threshold', () => {
    expect(shouldShowGitStatusPerfHint(GIT_STATUS_PERF_HINT_THRESHOLD)).toBe(true)
    expect(shouldShowGitStatusPerfHint(GIT_STATUS_PERF_HINT_THRESHOLD - 1)).toBe(false)
  })
})
