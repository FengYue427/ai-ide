import { describe, expect, it } from 'vitest'
import { buildFimContextFromSelection } from './fimMiddleSegment'

describe('fimMiddleSegment', () => {
  const text = 'line1\nline2\nline3\n'

  it('splits at cursor without selection', () => {
    const parts = buildFimContextFromSelection(text, null, { lineNumber: 2, column: 3 })
    expect(parts.prefix).toBe('line1\nli')
    expect(parts.suffix).toBe('ne2\nline3\n')
    expect(parts.middle).toBeUndefined()
  })

  it('splits with selection as middle', () => {
    const parts = buildFimContextFromSelection(
      text,
      { startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 6 },
      { lineNumber: 2, column: 3 },
    )
    expect(parts.prefix).toBe('line1\n')
    expect(parts.middle).toBe('line2')
    expect(parts.suffix).toBe('\nline3\n')
  })
})
