import { describe, expect, it } from 'vitest'
import { monacoLocationToReference } from './referenceLocationMapping'

describe('monacoLocationToReference', () => {
  it('maps file:/// and inmemory:// URIs to workspace paths with TS line/column', () => {
    const fromFile = monacoLocationToReference({
      uri: { toString: () => 'file:///main.ts' },
      range: { startLineNumber: 4, startColumn: 11 },
    })
    expect(fromFile).toEqual({ path: 'main.ts', line: 4, column: 11 })

    const fromMemory = monacoLocationToReference({
      uri: { toString: () => 'inmemory://lib/greet.ts' },
      range: { startLineNumber: 1, startColumn: 18 },
    })
    expect(fromMemory).toEqual({ path: 'lib/greet.ts', line: 1, column: 18 })
  })
})
