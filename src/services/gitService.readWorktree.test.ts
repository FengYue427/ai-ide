import { describe, expect, it } from 'vitest'
import { readWorktreeContents } from './gitService'

describe('readWorktreeContents', () => {
  it('reads files and marks missing paths as null', async () => {
    const fs = {
      readFile: async (path: string) => {
        if (path === '/a.ts') return 'hello'
        throw new Error('missing')
      },
    }

    const updates = await readWorktreeContents(fs, '/', ['a.ts', 'missing.ts', 'a.ts'])
    expect(updates).toEqual([
      { path: 'a.ts', content: 'hello' },
      { path: 'missing.ts', content: null },
    ])
  })
})
