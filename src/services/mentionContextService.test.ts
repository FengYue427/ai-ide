import { describe, expect, it } from 'vitest'
import {
  buildMentionContextSection,
  extractMentionTokens,
  resolveMentionToken,
} from './mentionContextService'
import type { ProjectIndex } from './projectIndexService'

const sampleIndex: ProjectIndex = {
  builtAt: 1,
  files: [
    {
      path: 'src/App.tsx',
      language: 'typescript',
      symbols: [{ name: 'App', kind: 'function', path: 'src/App.tsx', line: 10 }],
    },
    {
      path: 'lib/util.ts',
      language: 'typescript',
      symbols: [],
    },
  ],
}

describe('mentionContextService', () => {
  it('extracts unique mention tokens', () => {
    expect(extractMentionTokens('see @src/App.tsx and @App')).toEqual(['src/App.tsx', 'App'])
  })

  it('resolves file path mentions', () => {
    const resolved = resolveMentionToken(
      'lib/util.ts',
      [{ name: 'lib/util.ts', content: 'export const x = 1' }],
      sampleIndex,
    )
    expect(resolved?.path).toBe('lib/util.ts')
    expect(resolved?.content).toContain('export const x')
  })

  it('resolves path#symbol mentions', () => {
    const resolved = resolveMentionToken(
      'src/App.tsx#App',
      [{ name: 'src/App.tsx', content: 'function App() {}' }],
      sampleIndex,
    )
    expect(resolved?.symbol?.name).toBe('App')
    expect(resolved?.path).toBe('src/App.tsx')
  })

  it('builds mention section for chat prompt', () => {
    const section = buildMentionContextSection(
      'fix @src/App.tsx',
      [{ name: 'src/App.tsx', content: 'function App() { return 1 }' }],
      sampleIndex,
    )
    expect(section).toContain('用户 @ 提及')
    expect(section).toContain('src/App.tsx')
    expect(section).toContain('function App')
  })
})
