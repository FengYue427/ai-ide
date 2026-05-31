import { describe, expect, it } from 'vitest'
import { buildCdpBreakpointParams, breakpointUrlRegexForPath } from './debugBreakpointSync'

describe('debugBreakpointSync', () => {
  it('builds url regex from workspace path', () => {
    expect(breakpointUrlRegexForPath('src/app.ts')).toBe('src/app\\.ts$')
  })

  it('uses zero-based line in CDP params', () => {
    expect(
      buildCdpBreakpointParams({ id: 'a:10', path: 'index.js', line: 10, enabled: true }),
    ).toEqual({
      lineNumber: 9,
      urlRegex: 'index\\.js$',
    })
  })
})
