import { describe, expect, it } from 'vitest'
import {
  alignGhostIndent,
  buildGhostInlineRange,
  isMultilineGhostText,
} from './ghostLayoutEngine'

describe('ghostLayoutEngine', () => {
  it('detects multiline ghost text', () => {
    expect(isMultilineGhostText('a')).toBe(false)
    expect(isMultilineGhostText('a\nb')).toBe(true)
  })

  it('aligns continuation lines with current line indent', () => {
    const aligned = alignGhostIndent('return x\ny', '    const foo = ')
    expect(aligned).toBe('return x\n    y')
  })

  it('builds zero-width range for single-line insert', () => {
    const range = buildGhostInlineRange({
      insertText: 'foo()',
      lineNumber: 3,
      column: 10,
      lineContent: '  bar(',
    })
    expect(range).toEqual({
      insertText: 'foo()',
      startLineNumber: 3,
      startColumn: 10,
      endLineNumber: 3,
      endColumn: 10,
    })
  })

  it('builds cross-line range for multiline ghost', () => {
    const range = buildGhostInlineRange({
      insertText: 'line1\nline2\nline3',
      lineNumber: 5,
      column: 8,
      lineContent: '      ',
    })
    expect(range.insertText).toBe('line1\n      line2\n      line3')
    expect(range.startLineNumber).toBe(5)
    expect(range.startColumn).toBe(8)
    expect(range.endLineNumber).toBe(7)
    expect(range.endColumn).toBe(12)
  })
})
