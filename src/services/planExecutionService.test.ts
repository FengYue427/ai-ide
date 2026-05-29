import { describe, expect, it } from 'vitest'
import {
  buildPlanBackgroundJobPrompt,
  buildPlanExecutionPrompt,
  getFirstPlanStep,
  listPlanSteps,
  parsePlanBackgroundJobPrompt,
} from './planExecutionService'

describe('planExecutionService', () => {
  it('extracts first unchecked checklist step', () => {
    const text = '- [ ] step one\n- [ ] step two\n- [x] done'
    expect(getFirstPlanStep(text)).toBe('step one')
  })

  it('returns null when no unchecked checklist step exists', () => {
    const text = '- [x] done'
    expect(getFirstPlanStep(text)).toBeNull()
  })

  it('lists all unchecked checklist steps with line numbers', () => {
    const text = '- [x] done\n- [ ] step one\n- [ ] step two'
    expect(listPlanSteps(text)).toEqual([
      { text: 'step one', line: 2 },
      { text: 'step two', line: 3 },
    ])
  })

  it('builds execution prompt', () => {
    expect(buildPlanExecutionPrompt('refactor chat')).toContain('- [ ] refactor chat')
  })

  it('builds background job prompt with plan path', () => {
    const prompt = buildPlanBackgroundJobPrompt('.aide/plans/foo.md', 'refactor chat')
    expect(prompt).toContain('.aide/plans/foo.md')
    expect(prompt).toContain('- [ ] refactor chat')
  })

  it('parses background job prompt back to plan meta', () => {
    const prompt = buildPlanBackgroundJobPrompt('.aide/plans/foo.md', 'refactor chat')
    expect(parsePlanBackgroundJobPrompt(prompt)).toEqual({
      planPath: '.aide/plans/foo.md',
      stepText: 'refactor chat',
    })
  })
})
