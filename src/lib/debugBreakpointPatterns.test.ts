import { describe, expect, it } from 'vitest'
import { buildCdpBreakpointAttempts, breakpointUrlPatternsForPath } from './debugBreakpointPatterns'

describe('buildCdpBreakpointAttempts', () => {
  it('includes condition when set', () => {
    const attempts = buildCdpBreakpointAttempts({
      id: 'a:1',
      path: 'index.js',
      line: 5,
      enabled: true,
      condition: 'x > 1',
    })
    expect(attempts.length).toBeGreaterThan(0)
    expect(attempts.every((a) => a.condition === 'x > 1')).toBe(true)
    expect(attempts[0]?.lineNumber).toBe(4)
  })

  it('omits condition when blank', () => {
    const attempts = buildCdpBreakpointAttempts({
      id: 'a:2',
      path: 'lib/util.ts',
      line: 10,
      enabled: true,
      condition: '   ',
    })
    expect(attempts[0]?.condition).toBeUndefined()
  })

  it('builds multiple url patterns for nested paths', () => {
    const patterns = breakpointUrlPatternsForPath('src/app.js')
    expect(patterns.length).toBeGreaterThanOrEqual(2)
    expect(patterns[0]).toMatch(/src/)
  })
})
