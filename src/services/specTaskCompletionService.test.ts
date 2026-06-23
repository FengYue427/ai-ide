import { describe, expect, it } from 'vitest'
import { markSpecTaskDone, markSpecTaskDoneByText } from './specTaskCompletionService'

describe('specTaskCompletionService', () => {
  it('marks matching checklist line done', () => {
    const content = '- [ ] Ship feature\n- [ ] Add tests\n'
    expect(markSpecTaskDoneByText(content, 'Add tests')).toBe('- [ ] Ship feature\n- [x] Add tests\n')
  })

  it('updates file in array', () => {
    const files = [{ name: '.aide/specs/x/tasks.md', content: '- [ ] A\n' }]
    const next = markSpecTaskDone(files, '.aide/specs/x/tasks.md', 'A')
    expect(next[0]?.content).toContain('- [x] A')
  })
})
