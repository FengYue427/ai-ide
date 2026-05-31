import { describe, expect, it } from 'vitest'
import {
  nodeInspectBrkArgs,
  outputIndicatesDebuggerListening,
  parseInspectUrlFromOutput,
} from './debugAlphaService'

describe('debugAlphaService', () => {
  it('builds inspect-brk args', () => {
    expect(nodeInspectBrkArgs('index.js')).toEqual(['--inspect-brk=0.0.0.0:9229', 'index.js'])
  })

  it('parses ws url from node output', () => {
    const chunk = 'Debugger listening on ws://127.0.0.1:9229/abc\n'
    expect(outputIndicatesDebuggerListening(chunk)).toBe(true)
    expect(parseInspectUrlFromOutput(chunk)).toBe('ws://127.0.0.1:9229/abc')
  })
})
