import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WORKBENCH_LAYOUT,
  buildRestoredWorkbenchState,
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

  it('does not reopen review panels when restoring without saved visibility', () => {
    const restored = buildRestoredWorkbenchState({ workspaceMode: 'review', globalPrefs: null })
    expect(restored.showGitPanel).toBe(false)
    expect(restored.showCodeReview).toBe(false)
    expect(restored.showTerminal).toBe(false)
  })

  it('restores closed panels from global prefs', () => {
    const restored = buildRestoredWorkbenchState({
      workspaceMode: 'review',
      globalPrefs: {
        ...DEFAULT_WORKBENCH_LAYOUT,
        workspaceMode: 'review',
        showGitPanel: false,
        showCodeReview: false,
        showTerminal: false,
      },
    })
    expect(restored.showGitPanel).toBe(false)
    expect(restored.showCodeReview).toBe(false)
  })
})
