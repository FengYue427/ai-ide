import { describe, expect, it } from 'vitest'
import { buildCdpBreakpointAttempts } from './debugBreakpointPatterns'

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
    expect(attempts[0]?.condition).toBe('x > 1')
  })
})
