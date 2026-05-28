import { describe, expect, it } from 'vitest'
import { appendPlanStepsToSpecTasks, findLatestSpecTasksPath, listSpecTasksPaths } from './planSpecsBridgeService'

describe('planSpecsBridgeService', () => {
  it('finds latest spec tasks path', () => {
    const files = [
      { name: '.aide/specs/a/tasks.md', content: '' },
      { name: '.aide/specs/b/tasks.md', content: '' },
    ]
    expect(findLatestSpecTasksPath(files)).toBe('.aide/specs/b/tasks.md')
  })

  it('lists all spec task paths', () => {
    const files = [
      { name: '.aide/specs/a/tasks.md', content: '' },
      { name: '.aide/specs/b/tasks.md', content: '' },
      { name: '.aide/plans/p.md', content: '' },
    ]
    expect(listSpecTasksPaths(files)).toEqual(['.aide/specs/a/tasks.md', '.aide/specs/b/tasks.md'])
  })

  it('appends non-duplicate steps to target spec tasks', () => {
    const files = [{ name: '.aide/specs/a/tasks.md', content: '- [ ] existing\n' }]
    const result = appendPlanStepsToSpecTasks(files, '.aide/specs/a/tasks.md', ['existing', 'new step'])
    expect(result.added).toBe(1)
    expect(result.addedSteps).toEqual(['new step'])
    expect(result.files[0].content).toContain('- [ ] existing')
    expect(result.files[0].content).toContain('- [ ] new step')
  })
})

