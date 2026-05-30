import { describe, expect, it } from 'vitest'
import { clampBottomPanelHeight, mergeBottomPanelPrefs, normalizeBottomPanelPrefs } from './bottomPanelPrefs'

describe('bottomPanelPrefs', () => {
  it('clamps height within bounds', () => {
    expect(clampBottomPanelHeight(80, 800)).toBe(140)
    expect(clampBottomPanelHeight(900, 800)).toBe(576)
    expect(clampBottomPanelHeight(240, 800)).toBe(240)
  })

  it('normalizes stored prefs', () => {
    expect(normalizeBottomPanelPrefs({ tab: 'scripts', height: 300 })).toEqual({
      tab: 'scripts',
      height: 300,
    })
    expect(normalizeBottomPanelPrefs({ tab: 'invalid', height: 'x' }).tab).toBe('terminal')
  })

  it('merges partial updates', () => {
    const merged = mergeBottomPanelPrefs({ tab: 'terminal', height: 200 }, { tab: 'tasks' })
    expect(merged.tab).toBe('tasks')
    expect(merged.height).toBe(200)
  })
})
