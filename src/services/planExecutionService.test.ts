import { describe, expect, it } from 'vitest'
import { buildPlanExecutionPrompt, getFirstPlanStep } from './planExecutionService'

describe('planExecutionService', () => {
  it('extracts first unchecked checklist step', () => {
    const text = '- [ ] step one\n- [ ] step two\n- [x] done'
    expect(getFirstPlanStep(text)).toBe('step one')
  })

  it('returns null when no unchecked checklist step exists', () => {
    const text = '- [x] done'
    expect(getFirstPlanStep(text)).toBeNull()
  })

  it('builds execution prompt', () => {
    expect(buildPlanExecutionPrompt('refactor chat')).toContain('- [ ] refactor chat')
  })
})
