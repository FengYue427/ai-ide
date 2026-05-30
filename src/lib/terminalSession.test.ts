import { describe, expect, it } from 'vitest'
import {
  appendTerminalOutput,
  clearTerminalOutput,
  getTerminalOutputLines,
  registerTerminalWriter,
} from './terminalSession'

describe('terminalSession', () => {
  it('buffers line output for agent context', () => {
    clearTerminalOutput()
    registerTerminalWriter(null)
    appendTerminalOutput('line-a\nline-b\n')
    expect(getTerminalOutputLines()).toEqual(['line-a', 'line-b'])
    clearTerminalOutput()
  })

  it('forwards chunks to registered writer', () => {
    const chunks: string[] = []
    registerTerminalWriter({
      write: (data) => chunks.push(data),
      clear: () => chunks.push('__clear__'),
    })
    appendTerminalOutput('hello')
    expect(chunks).toEqual(['hello'])
    clearTerminalOutput()
    expect(chunks).toContain('__clear__')
    registerTerminalWriter(null)
  })
})
