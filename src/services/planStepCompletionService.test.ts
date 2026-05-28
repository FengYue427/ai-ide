import { describe, expect, it } from 'vitest'
import { markPlanStepDone, markPlanStepDoneByText, markPlanStepDoneLine } from './planStepCompletionService'

describe('planStepCompletionService', () => {
  it('marks unchecked step done by line', () => {
    const text = '- [ ] a\n- [ ] b'
    expect(markPlanStepDoneLine(text, 2)).toBe('- [ ] a\n- [x] b')
  })

  it('marks unchecked step done by exact text', () => {
    const text = '- [ ] step one\n- [ ] step two'
    expect(markPlanStepDoneByText(text, 'step two')).toContain('- [x] step two')
  })

  it('marks plan file in files list', () => {
    const files = [
      { name: '.aide/plans/p.md', content: '- [ ] x' },
      { name: 'x.md', content: 'X' },
    ]
    const next = markPlanStepDone(files, '.aide/plans/p.md', { text: 'x', line: 1 })
    expect(next[0].content).toBe('- [x] x')
    expect(next[1].content).toBe('X')
  })
})

