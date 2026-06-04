import { describe, expect, it } from 'vitest'
import {
  breakpointHasAdvancedOptions,
  updateBreakpointMetaInList,
  toggleBreakpointInList,
} from './debugBreakpoints'

describe('debugBreakpoints meta', () => {
  it('updates condition and hitCount', () => {
    const base = toggleBreakpointInList([], 'app.js', 10)
    const updated = updateBreakpointMetaInList(base, 'app.js', 10, {
      condition: 'n > 0',
      hitCount: 3,
    })
    const bp = updated.find((item) => item.path === 'app.js')
    expect(bp?.condition).toBe('n > 0')
    expect(bp?.hitCount).toBe(3)
    expect(breakpointHasAdvancedOptions(bp!)).toBe(true)
  })

  it('clears hitCount when set below 2', () => {
    const base = updateBreakpointMetaInList(toggleBreakpointInList([], 'x.js', 1), 'x.js', 1, {
      hitCount: 5,
    })
    const cleared = updateBreakpointMetaInList(base, 'x.js', 1, { hitCount: undefined })
    expect(cleared[0]?.hitCount).toBeUndefined()
  })
})
