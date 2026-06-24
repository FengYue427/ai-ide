import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WORKBENCH_LAYOUT,
  hasWorkbenchVisibilitySnapshot,
  normalizeWorkbenchLayoutPrefs,
  snapshotWorkbenchLayout,
  visibilityFromSnapshot,
} from './workbenchLayoutPrefs'

describe('workbenchLayoutPrefs', () => {
  it('normalizes stored layout', () => {
    const prefs = normalizeWorkbenchLayoutPrefs({
      workspaceMode: 'review',
      showGitPanel: true,
      showCodeReview: true,
      showTerminal: false,
      bottomPanelTab: 'tasks',
    })
    expect(prefs?.workspaceMode).toBe('review')
    expect(prefs?.showGitPanel).toBe(true)
    expect(prefs?.showCodeReview).toBe(true)
    expect(prefs?.showTerminal).toBe(false)
    expect(prefs?.bottomPanelTab).toBe('tasks')
  })

  it('rejects invalid payloads', () => {
    expect(normalizeWorkbenchLayoutPrefs(null)).toBeNull()
    expect(normalizeWorkbenchLayoutPrefs('bad')).toBeNull()
  })

  it('snapshots store slice', () => {
    const snap = snapshotWorkbenchLayout({
      ...DEFAULT_WORKBENCH_LAYOUT,
      showGitPanel: true,
      showTerminal: true,
    })
    expect(snap.showGitPanel).toBe(true)
    expect(snap.showTerminal).toBe(true)
    expect(snap.showChatPanel).toBe(false)
  })

  it('detects visibility in project panel snapshots', () => {
    expect(hasWorkbenchVisibilitySnapshot({ showGitPanel: false })).toBe(true)
    expect(hasWorkbenchVisibilitySnapshot({ sidebar: 240 } as never)).toBe(false)
  })

  it('fills visibility defaults', () => {
    expect(visibilityFromSnapshot({ showGitPanel: true }).showChatPanel).toBe(false)
    expect(visibilityFromSnapshot({ showGitPanel: true }).showGitPanel).toBe(true)
  })
})
