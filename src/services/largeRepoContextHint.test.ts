import { describe, expect, it } from 'vitest'
import { getLargeRepoContextHint, shouldShowLargeRepoHint } from './largeRepoContextHint'

describe('largeRepoContextHint', () => {
  it('returns capped hint when index is capped', () => {
    const hint = getLargeRepoContextHint({
      totalFiles: 1000,
      eligibleFiles: 800,
      indexedFiles: 500,
      capped: true,
    })
    expect(hint?.kind).toBe('capped')
  })

  it('shows hint only when workspace or mentions need index', () => {
    const hint = getLargeRepoContextHint({
      totalFiles: 600,
      eligibleFiles: 500,
      indexedFiles: 500,
      capped: true,
    })
    expect(shouldShowLargeRepoHint(hint, { useWorkspaceContext: false, mentionTokenCount: 0 })).toBe(false)
    expect(shouldShowLargeRepoHint(hint, { useWorkspaceContext: true, mentionTokenCount: 0 })).toBe(true)
    expect(shouldShowLargeRepoHint(hint, { useWorkspaceContext: false, mentionTokenCount: 1 })).toBe(true)
  })
})
