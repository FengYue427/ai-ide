import { describe, expect, it } from 'vitest'
import { countUnresolvedMentions, runMentionPreflight } from './mentionPreflight'
import type { ProjectIndex } from './projectIndexService'

const sampleIndex: ProjectIndex = {
  builtAt: 1,
  files: [
    {
      path: 'src/a.ts',
      language: 'typescript',
      symbols: [{ name: 'foo', kind: 'function', path: 'src/a.ts', line: 1 }],
    },
    {
      path: 'src/b.ts',
      language: 'typescript',
      symbols: [{ name: 'foo', kind: 'function', path: 'src/b.ts', line: 2 }],
    },
    {
      path: 'lib/util.ts',
      language: 'typescript',
      symbols: [],
    },
  ],
}

describe('mentionPreflight', () => {
  it('flags unresolved tokens', () => {
    const result = runMentionPreflight('see @missing.ts', [], sampleIndex)
    expect(countUnresolvedMentions(result)).toBe(1)
  })

  it('flags ambiguous bare symbol names', () => {
    const result = runMentionPreflight('fix @foo', [], sampleIndex)
    expect(result.issues.some((issue) => issue.kind === 'ambiguous' && issue.token === 'foo')).toBe(true)
  })

  it('resolves file mentions', () => {
    const result = runMentionPreflight(
      '@lib/util.ts',
      [{ name: 'lib/util.ts', content: 'export const x = 1' }],
      sampleIndex,
    )
    expect(result.resolved).toHaveLength(1)
    expect(countUnresolvedMentions(result)).toBe(0)
  })
})
