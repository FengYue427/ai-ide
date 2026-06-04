import { describe, expect, it } from 'vitest'
import {
  effectiveHitCount,
  findBreakpointsAtLocation,
  recordHitAndShouldPause,
} from './debugBreakpointHitCount'
import type { DebugBreakpoint } from './debugBreakpoints'

const bp = (overrides: Partial<DebugBreakpoint> = {}): DebugBreakpoint => ({
  id: 'a:2',
  path: 'a.js',
  line: 2,
  enabled: true,
  ...overrides,
})

describe('debugBreakpointHitCount', () => {
  it('finds breakpoints at path and line', () => {
    const list = [bp(), bp({ id: 'b:3', path: 'b.js', line: 3 })]
    expect(findBreakpointsAtLocation(list, 'a.js', 2)).toHaveLength(1)
    expect(findBreakpointsAtLocation(list, 'b.js', 2)).toHaveLength(0)
  })

  it('pauses every hit when hitCount unset', () => {
    const hits = new Map<string, number>()
    expect(recordHitAndShouldPause(hits, bp()).shouldPause).toBe(true)
    expect(recordHitAndShouldPause(hits, bp()).shouldPause).toBe(true)
  })

  it('pauses only after N hits', () => {
    const hits = new Map<string, number>()
    const conditional = bp({ hitCount: 3 })
    expect(recordHitAndShouldPause(hits, conditional)).toEqual({ shouldPause: false, hits: 1 })
    expect(recordHitAndShouldPause(hits, conditional)).toEqual({ shouldPause: false, hits: 2 })
    expect(recordHitAndShouldPause(hits, conditional)).toEqual({ shouldPause: true, hits: 3 })
  })

  it('effectiveHitCount treats invalid as 1', () => {
    expect(effectiveHitCount(bp({ hitCount: 0 }))).toBe(1)
    expect(effectiveHitCount(bp({ hitCount: 5 }))).toBe(5)
  })
})
