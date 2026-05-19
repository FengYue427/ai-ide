import { describe, expect, it } from 'vitest'
import {
  buildReplacePreview,
  collectSearchableFiles,
  highlightMatchSnippet,
  replaceInFile,
  searchInFiles,
} from './searchService'

describe('searchService', () => {
  const files = [
    { name: 'a.ts', content: 'const foo = 1\nconst bar = 2' },
    { name: 'b.ts', content: 'function foo() {}\n' },
  ]

  it('collects editor and workspace files without duplicates', () => {
    const merged = collectSearchableFiles(
      [{ name: 'a.ts', content: 'editor' }],
      [{ path: 'a.ts', content: 'workspace' }, { path: 'lib/b.ts', content: 'x' }],
    )
    expect(merged.find((file) => file.name === 'a.ts')?.content).toBe('editor')
    expect(merged.some((file) => file.name === 'lib/b.ts')).toBe(true)
  })

  it('searches with regex across files', () => {
    const hits = searchInFiles(files, 'foo\\w*', { regex: true })
    expect(hits.length).toBeGreaterThanOrEqual(2)
  })

  it('builds replace preview grouped by file', () => {
    const preview = buildReplacePreview(files, 'foo', {})
    expect(preview).toHaveLength(2)
    expect(preview[0]?.matchCount).toBeGreaterThan(0)
  })

  it('replaces with regex capture groups', () => {
    const next = replaceInFile('foo-bar', 'foo', 'baz', { regex: true })
    expect(next).toBe('baz-bar')
  })

  it('highlights first match in snippet', () => {
    const snippet = highlightMatchSnippet('hello world', 'world', {})
    expect(snippet).toContain('⟦world⟧')
  })
})
