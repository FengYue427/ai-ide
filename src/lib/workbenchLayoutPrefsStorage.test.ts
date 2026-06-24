import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeWorkbenchLayoutPrefs, snapshotWorkbenchLayout } from './workbenchLayoutPrefs'
import { loadWorkbenchLayoutPrefsSync, saveWorkbenchLayoutPrefsSync } from './workbenchLayoutPrefsStorage'

describe('workbenchLayoutPrefsStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips via localStorage', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })

    const state = snapshotWorkbenchLayout({
      workspaceMode: 'review',
      showSearchPanel: false,
      showPreview: false,
      showCodeReview: false,
      showPerformance: false,
      showChatPanel: false,
      showGitPanel: false,
      showTerminal: false,
      bottomPanelTab: 'tasks',
      rightPanelView: 'chat',
      intentShellEnabled: true,
      intentShellGraphOpen: false,
      intentShellQueueRailOpen: true,
    })
    saveWorkbenchLayoutPrefsSync(state)
    const loaded = loadWorkbenchLayoutPrefsSync()
    expect(loaded).toEqual(normalizeWorkbenchLayoutPrefs(state))
  })
})
