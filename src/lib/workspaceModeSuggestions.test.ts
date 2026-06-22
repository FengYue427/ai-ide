import { describe, expect, it } from 'vitest'
import { inferSuggestedWorkspaceMode } from './workspaceModeSuggestions'

describe('workspaceModeSuggestions', () => {
  it('suggests execute when queue is active', () => {
    expect(
      inferSuggestedWorkspaceMode({
        activeFileName: 'src/a.ts',
        workspaceMode: 'code',
        queueActive: true,
        openTaskCount: 1,
        gitModifiedCount: 0,
        planFileOpen: false,
      }),
    ).toBe('execute')
  })

  it('suggests plan when plan file is open', () => {
    expect(
      inferSuggestedWorkspaceMode({
        activeFileName: '.aide/plans/sprint.md',
        workspaceMode: 'code',
        queueActive: false,
        openTaskCount: 0,
        gitModifiedCount: 0,
        planFileOpen: true,
      }),
    ).toBe('plan')
  })
})
