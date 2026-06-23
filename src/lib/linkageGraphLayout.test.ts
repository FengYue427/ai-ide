import { describe, expect, it } from 'vitest'
import { layoutLinkageOverlayGraph } from './linkageGraphLayout'

describe('linkageGraphLayout', () => {
  it('positions goal above git and task anchor', () => {
    const { nodes } = layoutLinkageOverlayGraph(
      [
        { id: 'link:goal', kind: 'goal', label: 'Ship auth', status: 'active' },
        { id: 'link:git', kind: 'git', label: 'git-clean', status: 'done' },
        { id: 'task:.aide/specs/x/tasks.md:root', kind: 'queue', label: 'tasks', status: 'open' },
      ],
      [{ from: 'link:goal', to: 'task:.aide/specs/x/tasks.md:root', kind: 'spawns' }],
    )
    const goal = nodes.find((node) => node.id === 'link:goal')
    const git = nodes.find((node) => node.id === 'link:git')
    const task = nodes.find((node) => node.id === 'task:.aide/specs/x/tasks.md:root')
    expect(goal && git && task).toBeTruthy()
    expect(goal!.y).toBeLessThan(task!.y)
    expect(task!.y).toBeLessThan(git!.y)
  })
})
