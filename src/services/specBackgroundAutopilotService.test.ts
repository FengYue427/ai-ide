import { describe, expect, it } from 'vitest'
import {
  buildSpecBackgroundJobPrompt,
  isSpecTaskQueuedInJobs,
  parseSpecBackgroundJobPrompt,
} from './specBackgroundAutopilotService'

describe('specBackgroundAutopilotService', () => {
  it('builds and parses spec background job prompt', () => {
    const prompt = buildSpecBackgroundJobPrompt('.aide/specs/x/tasks.md', 'Add tests', 'en-US')
    expect(prompt).toContain('## Spec')
    expect(prompt).toContain('Path: .aide/specs/x/tasks.md')
    expect(prompt).toContain('Task: Add tests')
    expect(parseSpecBackgroundJobPrompt(prompt)).toEqual({
      tasksPath: '.aide/specs/x/tasks.md',
      taskText: 'Add tests',
    })
  })

  it('detects duplicate queued spec tasks', () => {
    const prompt = buildSpecBackgroundJobPrompt('.aide/specs/x/tasks.md', 'Add tests')
    expect(
      isSpecTaskQueuedInJobs(
        [{ prompt, status: 'queued' }],
        '.aide/specs/x/tasks.md',
        'Add tests',
      ),
    ).toBe(true)
    expect(
      isSpecTaskQueuedInJobs(
        [{ prompt, status: 'succeeded' }],
        '.aide/specs/x/tasks.md',
        'Add tests',
      ),
    ).toBe(false)
  })
})
