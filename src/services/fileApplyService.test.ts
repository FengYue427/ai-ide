import { describe, expect, it } from 'vitest'
import { applyChangesToFiles } from './fileApplyService'

describe('fileApplyService', () => {
  it('updates existing file and appends new file', () => {
    const next = applyChangesToFiles(
      [{ name: 'a.ts', content: 'old', language: 'typescript' }],
      [{ path: 'a.ts', content: 'new', language: 'typescript' }, { path: 'b.ts', content: 'x', language: 'typescript' }],
    )
    expect(next).toHaveLength(2)
    expect(next[0].content).toBe('new')
    expect(next[1].name).toBe('b.ts')
  })
})
