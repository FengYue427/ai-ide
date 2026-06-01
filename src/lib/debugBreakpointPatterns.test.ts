import { describe, expect, it } from 'vitest'
import { breakpointUrlPatternsForPath } from './debugBreakpointPatterns'

describe('breakpointUrlPatternsForPath', () => {
  it('includes full path and file-name suffix patterns', () => {
    const patterns = breakpointUrlPatternsForPath('src/app.ts')
    expect(patterns[0]).toBe('src/app\\.ts$')
    expect(patterns.some((p) => p.includes('app\\.ts'))).toBe(true)
  })
})
