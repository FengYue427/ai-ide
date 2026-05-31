import { describe, expect, it } from 'vitest'
import { injectDebuggerStatementsAtLines } from './debugBreakpointInjection'

describe('injectDebuggerStatementsAtLines', () => {
  it('inserts debugger before target lines without shifting earlier targets', () => {
    const source = 'line1\nline2\nline3\n'
    const next = injectDebuggerStatementsAtLines(source, [2, 3])
    expect(next).toBe('line1\ndebugger;\nline2\ndebugger;\nline3\n')
  })

  it('skips duplicate debugger lines', () => {
    const source = 'debugger;\nrun()\n'
    expect(injectDebuggerStatementsAtLines(source, [2])).toBe('debugger;\ndebugger;\nrun()\n')
  })
})
