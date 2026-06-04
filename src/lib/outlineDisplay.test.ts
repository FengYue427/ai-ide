import { describe, expect, it } from 'vitest'
import { formatOutlineSymbolLabel, isScopedOutlineSymbol } from './outlineDisplay'

describe('outlineDisplay', () => {
  it('includes scope prefix for nested symbols', () => {
    expect(
      formatOutlineSymbolLabel({
        name: 'run',
        kind: 'method',
        path: 'app.ts',
        line: 12,
        scope: 'AppService',
      }),
    ).toBe('AppService.run')
  })

  it('uses bare name for top-level symbols', () => {
    expect(
      formatOutlineSymbolLabel({
        name: 'AppService',
        kind: 'class',
        path: 'app.ts',
        line: 1,
      }),
    ).toBe('AppService')
  })

  it('detects scoped outline rows', () => {
    expect(isScopedOutlineSymbol({ name: 'x', kind: 'method', path: 'a.ts', line: 1, scope: 'C' })).toBe(true)
    expect(isScopedOutlineSymbol({ name: 'x', kind: 'class', path: 'a.ts', line: 1 })).toBe(false)
  })
})
