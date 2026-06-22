import { describe, expect, it } from 'vitest'
import { suggestNextSpecTask } from './autopilotLiteService'

describe('suggestNextSpecTask', () => {
  it('returns first open task', () => {
    const suggestion = suggestNextSpecTask(
      [{ name: '.aide/specs/demo/tasks.md', content: '- [x] Done\n- [ ] Next', language: 'markdown' }],
      '.aide/specs/demo/tasks.md',
    )
    expect(suggestion?.taskText).toBe('Next')
  })
})
