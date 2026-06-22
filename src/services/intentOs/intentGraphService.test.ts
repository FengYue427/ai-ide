import { describe, expect, it } from 'vitest'
import { buildIntentGraph, mergeIntentGraphWithReplay } from './intentGraphService'

describe('buildIntentGraph', () => {
  it('links plan step to spec task', () => {
    const graph = buildIntentGraph({
      files: [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '- [ ] Implement feature\n- [x] Done step',
          language: 'markdown',
        },
        {
          name: '.aide/specs/demo/acceptance.md',
          content: '- [ ] Tests pass',
          language: 'markdown',
        },
      ],
      links: [
        {
          planPath: '.aide/plans/feature.md',
          planStepText: 'Implement feature',
          specTasksPath: '.aide/specs/demo/tasks.md',
          specTaskText: 'Implement feature',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })

    expect(graph.nodes.some((n) => n.kind === 'plan')).toBe(true)
    expect(graph.edges.some((e) => e.label === 'maps')).toBe(true)
    expect(graph.nodes.some((n) => n.kind === 'acceptance')).toBe(true)
  })

  it('shows spec tasks without plan links', () => {
    const graph = buildIntentGraph({
      files: [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '- [ ] Open task\n- [x] Done task',
          language: 'markdown',
        },
        {
          name: '.aide/specs/demo/acceptance.md',
          content: '- [ ] Checklist item',
          language: 'markdown',
        },
      ],
      links: [],
    })

    expect(graph.nodes.some((n) => n.kind === 'spec-task' && n.status === 'open')).toBe(true)
    expect(graph.nodes.some((n) => n.kind === 'acceptance')).toBe(true)
    expect(graph.edges.some((e) => e.label === 'verify')).toBe(true)
  })
})

describe('mergeIntentGraphWithReplay', () => {
  it('adds overlay nodes missing from live graph', () => {
    const live = { nodes: [{ id: 'a', kind: 'spec-task' as const, label: 'live' }], edges: [] }
    const overlay = {
      nodes: [{ id: 'b', kind: 'spec-task' as const, label: 'replay' }],
      edges: [{ from: 'a', to: 'b' }],
    }
    const merged = mergeIntentGraphWithReplay(live, overlay)
    expect(merged.nodes).toHaveLength(2)
    expect(merged.edges).toHaveLength(1)
  })
})
