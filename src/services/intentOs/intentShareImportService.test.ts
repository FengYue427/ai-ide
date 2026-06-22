import { describe, expect, it } from 'vitest'
import { applyIntentShareFromImportedFiles, applyIntentShareSnapshotContent, parseIntentShareSnapshot } from './intentShareImportService'

describe('intentShareImportService', () => {
  it('parses valid intent share snapshot', () => {
    const result = parseIntentShareSnapshot(
      JSON.stringify({
        version: 1,
        generatedAt: '2026-06-01T00:00:00.000Z',
        activeSpecPath: '.aide/specs/demo/tasks.md',
        specs: [{ slug: 'demo', tasksPath: '.aide/specs/demo/tasks.md', openTasks: 1, doneTasks: 2, totalTasks: 3 }],
        graph: { nodes: [{ id: 'n1', kind: 'spec-task', label: 't' }], edges: [] },
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.snapshot.specs[0].slug).toBe('demo')
      expect(result.summary).toContain('demo')
    }
  })

  it('rejects unsupported version', () => {
    const result = parseIntentShareSnapshot(JSON.stringify({ version: 2, specs: [], graph: { nodes: [], edges: [] } }))
    expect(result.ok).toBe(false)
  })

  it('applies focus from imported files', () => {
    const focus = applyIntentShareFromImportedFiles([
      {
        name: '.aide/meta/intent-share.json',
        content: JSON.stringify({
          version: 1,
          generatedAt: '2026-06-01T00:00:00.000Z',
          activeSpecPath: '.aide/specs/demo/tasks.md',
          specs: [{ slug: 'demo', tasksPath: '.aide/specs/demo/tasks.md', openTasks: 0, doneTasks: 1, totalTasks: 1 }],
          graph: { nodes: [], edges: [] },
        }),
      },
    ])
    expect(focus?.focusTasksPath).toBe('.aide/specs/demo/tasks.md')
    expect(focus?.summary).toContain('demo')
  })

  it('parses standalone snapshot content', () => {
    const focus = applyIntentShareSnapshotContent(
      JSON.stringify({
        version: 1,
        generatedAt: '2026-06-01T00:00:00.000Z',
        activeSpecPath: '.aide/specs/demo/tasks.md',
        specs: [{ slug: 'demo', tasksPath: '.aide/specs/demo/tasks.md', openTasks: 0, doneTasks: 1, totalTasks: 1 }],
        graph: { nodes: [], edges: [] },
      }),
    )
    expect(focus?.focusTasksPath).toBe('.aide/specs/demo/tasks.md')
  })
})
