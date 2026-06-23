import { describe, expect, it } from 'vitest'
import { isLinkageOverlayNavigable, resolveLinkageOverlayNavigate } from './linkageOverlayNavigation'

describe('linkageOverlayNavigation', () => {
  const tasksPath = '.aide/specs/auth/tasks.md'

  it('maps git node to git panel', () => {
    expect(resolveLinkageOverlayNavigate({ id: 'link:git', kind: 'git', label: 'git-clean' }, tasksPath)).toEqual({
      kind: 'git',
    })
  })

  it('maps bg-job to background jobs', () => {
    expect(
      resolveLinkageOverlayNavigate({ id: 'link:bg-job', kind: 'bg-job', label: 'jobs:1' }, tasksPath),
    ).toEqual({ kind: 'background-jobs' })
  })

  it('maps goal task child to tasks path', () => {
    expect(
      resolveLinkageOverlayNavigate(
        { id: 'link:goal:task:0', kind: 'goal', label: 'Wire OAuth' },
        tasksPath,
      ),
    ).toEqual({ kind: 'tasks', path: tasksPath })
  })

  it('returns null for mode node', () => {
    expect(
      isLinkageOverlayNavigable({ id: 'link:mode', kind: 'mode', label: 'execute' }, tasksPath),
    ).toBe(false)
  })
})
