import { describe, expect, it } from 'vitest'
import { grepInSources } from './grepRepoCore'

describe('grepRepoCore', () => {
  it('finds text matches with path:line format', () => {
    const hits = grepInSources(
      [{ name: 'src/a.ts', content: 'export const hello = 1\nconst world = 2' }],
      [],
      { pattern: 'hello' },
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].file).toBe('src/a.ts')
    expect(hits[0].line).toBe(1)
  })

  it('respects glob filter', () => {
    const hits = grepInSources(
      [
        { name: 'src/a.ts', content: 'needle here' },
        { name: 'docs/readme.md', content: 'needle there' },
      ],
      [],
      { pattern: 'needle', glob: 'src/**/*.ts' },
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].file).toBe('src/a.ts')
  })
})
