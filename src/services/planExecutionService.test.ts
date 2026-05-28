import { describe, expect, it } from 'vitest'
import { buildPlanExecutionPrompt, getFirstPlanStep, listPlanSteps } from './planExecutionService'

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
})
