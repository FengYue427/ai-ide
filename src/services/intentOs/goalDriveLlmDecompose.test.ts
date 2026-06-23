import { describe, expect, it } from 'vitest'
import { parseLlmGoalTaskLines } from './goalDriveLlmDecompose'

describe('goalDriveLlmDecompose', () => {
  it('parses JSON task array from LLM output', () => {
    const tasks = parseLlmGoalTaskLines('Here you go:\n["Wire OAuth", "Add tests", "Update docs"]')
    expect(tasks).toEqual(['Wire OAuth', 'Add tests', 'Update docs'])
  })

  it('parses markdown bullet tasks', () => {
    const tasks = parseLlmGoalTaskLines('- [ ] First task\n- Second task\n- Third one')
    expect(tasks?.length).toBeGreaterThanOrEqual(2)
    expect(tasks?.[0]).toContain('First')
  })

  it('returns null for too few tasks', () => {
    expect(parseLlmGoalTaskLines('only one line that is long enough')).toBeNull()
  })
})
