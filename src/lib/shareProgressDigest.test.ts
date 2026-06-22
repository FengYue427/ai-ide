import { describe, expect, it } from 'vitest'
import { buildShareProgressDigest } from './shareProgressDigest'
import type { ShareProgressViewModel } from './shareProgressView'

import type { WeeklyRecap } from './weeklyRecapService'

const emptyRecap: WeeklyRecap = {
  doneTaskCount: 2,
  openTaskCount: 1,
  specCount: 1,
  proofReportCount: 0,
  queueReportCount: 0,
  recentProofPaths: [],
  learningPathCompleted: [],
  learningPathInProgress: [],
}

function sampleView(overrides: Partial<ShareProgressViewModel> = {}): ShareProgressViewModel {
  return {
    intentSnapshot: {
      version: 1,
      generatedAt: '2026-01-01T00:00:00.000Z',
      activeSpecPath: 'specs/demo/tasks.md',
      specs: [{ slug: 'demo', tasksPath: 'specs/demo/tasks.md', openTasks: 1, doneTasks: 2, totalTasks: 3 }],
      graph: { nodes: [{ id: 'a', kind: 'spec-task', label: 'Task' }], edges: [] },
    },
    intentSummary: 'demo: 2/3',
    proofHtmlFiles: [],
    weeklyRecap: emptyRecap,
    ...overrides,
  }
}

describe('buildShareProgressDigest', () => {
  it('changes when task progress changes', () => {
    const before = buildShareProgressDigest(sampleView())
    const after = buildShareProgressDigest(
      sampleView({
        intentSnapshot: {
          version: 1,
          generatedAt: '2026-01-01T00:00:00.000Z',
          activeSpecPath: 'specs/demo/tasks.md',
          specs: [{ slug: 'demo', tasksPath: 'specs/demo/tasks.md', openTasks: 0, doneTasks: 3, totalTasks: 3 }],
          graph: { nodes: [{ id: 'a', kind: 'spec-task', label: 'Task' }], edges: [] },
        },
      }),
    )
    expect(before).not.toBe(after)
  })
})
