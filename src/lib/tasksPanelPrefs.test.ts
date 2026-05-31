import { describe, expect, it } from 'vitest'
import {
  normalizeTasksPanelCollapsePrefs,
  pathsForAutoCollapsedGroups,
  TASKS_PANEL_AUTO_COLLAPSE_THRESHOLD,
} from './tasksPanelPrefs'

describe('tasksPanelPrefs', () => {
  it('normalizes collapse prefs', () => {
    expect(normalizeTasksPanelCollapsePrefs({ collapsedPaths: ['a', 'a', 1, 'b'] })).toEqual({
      collapsedPaths: ['a', 'b'],
    })
  })

  it('auto-collapses completed groups when list is large', () => {
    const groups = [
      { path: 'done.md', items: [{ done: true }, { done: true }] },
      { path: 'open.md', items: [{ done: false }] },
    ]
    const total = TASKS_PANEL_AUTO_COLLAPSE_THRESHOLD
    expect(pathsForAutoCollapsedGroups(groups, total - 1)).toEqual([])
    expect(pathsForAutoCollapsedGroups(groups, total)).toEqual(['done.md'])
  })
})
