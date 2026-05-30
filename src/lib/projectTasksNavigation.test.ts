import { describe, expect, it } from 'vitest'
import {
  buildOpenTasksAgentPrompt,
  listOpenTasksFromGroups,
  listTaskFileGroups,
} from './projectTasksNavigation'

describe('projectTasksNavigation', () => {
  it('lists project and spec task groups', () => {
    const groups = listTaskFileGroups([
      {
        path: '.aide/specs/auth/tasks.md',
        content: '# Auth\n- [ ] Login\n- [x] Logout\n',
      },
      {
        path: '.aide/tasks.md',
        content: '# Project\n- [ ] Ship v1.1.5\n',
      },
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0].kind).toBe('project')
    expect(groups[1].kind).toBe('spec')
    expect(groups[1].title).toBe('Auth')
  })

  it('collects open tasks for agent prompt', () => {
    const groups = listTaskFileGroups([
      { path: '.aide/tasks.md', content: '- [ ] One\n- [x] Two\n' },
    ])
    const open = listOpenTasksFromGroups(groups)
    expect(open).toEqual([{ path: '.aide/tasks.md', text: 'One', line: 1 }])
    expect(buildOpenTasksAgentPrompt(open, 'en-US')).toContain('One')
  })
})
