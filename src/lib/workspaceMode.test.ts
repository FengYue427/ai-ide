import { describe, expect, it } from 'vitest'
import { getWorkspaceModeLayout, WORKSPACE_MODES } from './workspaceMode'

describe('workspaceMode', () => {
  it('defines four modes', () => {
    expect(WORKSPACE_MODES).toEqual(['code', 'plan', 'execute', 'review'])
  })

  it('execute mode enables intent shell', () => {
    expect(getWorkspaceModeLayout('execute').intentShellEnabled).toBe(true)
  })

  it('code mode closes panels', () => {
    const layout = getWorkspaceModeLayout('code')
    expect(layout.showChatPanel).toBe(false)
    expect(layout.intentShellEnabled).toBe(false)
  })

  it('review mode opens git and code review', () => {
    const layout = getWorkspaceModeLayout('review')
    expect(layout.showGitPanel).toBe(true)
    expect(layout.showCodeReview).toBe(true)
  })
})
