import { describe, expect, it } from 'vitest'
import { appendProjectRules, extractProjectRules, isProjectRulesPath } from './projectRulesService'

describe('projectRulesService', () => {
  it('detects rules file paths', () => {
    expect(isProjectRulesPath('.aide/rules.md')).toBe(true)
    expect(isProjectRulesPath('src/index.ts')).toBe(false)
  })

  it('extracts and appends rules', () => {
    const rules = extractProjectRules([
      { path: '.aide/rules.md', content: 'Use TypeScript strict mode.' },
    ])
    expect(rules).toContain('strict')
    const prompt = appendProjectRules('Base prompt', rules)
    expect(prompt).toContain('项目规则（.aide/rules）')
    expect(prompt).toContain('strict')
  })
})
