import { describe, expect, it } from 'vitest'
import { buildIntentLinkageGraph } from './intentLinkageGraphService'

describe('intentLinkageGraphService', () => {
  it('adds linkage overlay for git and queue', () => {
    const graph = buildIntentLinkageGraph({
      files: [
        {
          name: '.aide/specs/x/tasks.md',
          content: '- [ ] Implement\n',
          language: 'markdown',
        },
      ],
      focusTasksPath: '.aide/specs/x/tasks.md',
      workspaceMode: 'execute',
      gitModifiedCount: 0,
      queueBusy: false,
      backgroundJobsActive: 1,
      goalText: 'Ship feature',
      autopilotActive: true,
    })
    expect(graph.openTaskCount).toBe(1)
    expect(graph.overlayNodes.some((n) => n.kind === 'git')).toBe(true)
    expect(graph.overlayNodes.some((n) => n.kind === 'bg-job')).toBe(true)
    expect(graph.overlayEdges.some((e) => e.kind === 'blocks' || e.kind === 'enables')).toBe(true)
  })

  it('adds decomposed goal task nodes', () => {
    const graph = buildIntentLinkageGraph({
      files: [],
      focusTasksPath: '.aide/specs/x/tasks.md',
      goalText: 'Ship billing',
      decomposedTasks: ['Wire webhook', 'Add tests'],
    })
    expect(graph.overlayNodes.some((n) => n.id === 'link:goal:task:0')).toBe(true)
    expect(graph.overlayEdges.some((e) => e.label === 'llm-task')).toBe(true)
  })
})
