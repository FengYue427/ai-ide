import { describe, expect, it } from 'vitest'
import {
  gitignoreRulesFromSources,
  isPathIgnoredByGitignore,
  mergeGitignoreContents,
  parseGitignore,
} from './gitignoreService'

describe('gitignoreService', () => {
  it('parses negation and directory rules', () => {
    const rules = parseGitignore(`
# comment
dist/
*.log
!important.log
`)
    expect(isPathIgnoredByGitignore('dist/out.js', rules)).toBe(true)
    expect(isPathIgnoredByGitignore('debug.log', rules)).toBe(true)
    expect(isPathIgnoredByGitignore('important.log', rules)).toBe(false)
  })

  it('ignores node_modules via pattern', () => {
    const rules = parseGitignore('node_modules/')
    expect(isPathIgnoredByGitignore('node_modules/pkg/index.js', rules)).toBe(true)
    expect(isPathIgnoredByGitignore('src/index.ts', rules)).toBe(false)
  })

  it('merges multiple .gitignore files', () => {
    const merged = mergeGitignoreContents([
      { path: '.gitignore', content: 'dist/' },
      { path: 'packages/app/.gitignore', content: '*.local' },
    ])
    const rules = gitignoreRulesFromSources([
      { path: '.gitignore', content: 'dist/' },
      { path: 'packages/app/.gitignore', content: '*.local' },
    ])
    expect(merged).toContain('dist/')
    expect(isPathIgnoredByGitignore('dist/a.js', rules)).toBe(true)
    expect(isPathIgnoredByGitignore('debug.local', rules)).toBe(true)
  })
})
