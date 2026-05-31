import { describe, expect, it } from 'vitest'
import { breakpointKey, setBreakpointEnabledInList, toggleBreakpointInList } from './debugBreakpoints'

describe('debugBreakpoints', () => {
  it('toggles breakpoint on and off', () => {
    const first = toggleBreakpointInList([], 'index.js', 3)
    expect(first).toHaveLength(1)
    expect(first[0]?.line).toBe(3)

    const second = toggleBreakpointInList(first, 'index.js', 3)
    expect(second).toHaveLength(0)
  })

  it('builds stable keys', () => {
    expect(breakpointKey('a.ts', 10)).toBe('a.ts:10')
  })

  it('toggles enabled state without removing breakpoint', () => {
    const first = toggleBreakpointInList([], 'a.ts', 4)
    const disabled = setBreakpointEnabledInList(first, 'a.ts', 4, false)
    expect(disabled[0]?.enabled).toBe(false)
    const enabled = setBreakpointEnabledInList(disabled, 'a.ts', 4, true)
    expect(enabled[0]?.enabled).toBe(true)
  })
})
