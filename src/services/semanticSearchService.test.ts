import { describe, expect, it } from 'vitest'
import { formatSemanticContextSection } from './semanticSearchService'

describe('formatSemanticContextSection', () => {
  it('formats ranked chunks for system prompt', () => {
    const section = formatSemanticContextSection(
      [{ path: 'src/a.ts', text: 'export function auth() {}', score: 0.82 }],
      'zh-CN',
    )
    expect(section).toContain('语义检索相关片段')
    expect(section).toContain('src/a.ts')
    expect(section).toContain('export function auth')
  })

  it('formats English section title', () => {
    const section = formatSemanticContextSection(
      [{ path: 'src/a.ts', text: 'export function auth() {}', score: 0.82 }],
      'en-US',
    )
    expect(section).toContain('Semantic search snippets')
  })
})
