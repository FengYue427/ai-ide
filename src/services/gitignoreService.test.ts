import { describe, expect, it } from 'vitest'
import { isPathIgnoredByGitignore, parseGitignore } from './gitignoreService'

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
})
