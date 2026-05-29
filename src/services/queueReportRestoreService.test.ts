import { describe, expect, it } from 'vitest'
import { buildQueueExecutionReportMarkdown } from './queueExecutionReportService'
import { buildQueueRestoreFromReport } from './queueReportRestoreService'

describe('queueReportRestoreService', () => {
  it('restores plan and spec items from restore hints', () => {
    const md = buildQueueExecutionReportMarkdown({
      sessionStatus: 'idle',
      runId: null,
      activeTask: null,
      success: { plan: 1, spec: 0 },
      failure: { plan: 1, spec: 0 },
      recentDone: [],
      pending: { planQueue: 0, specQueue: 0, sendQueue: 0, planPreview: [], specPreview: [] },
      restoreHints: {
        plan: [{ planPath: '.aide/plans/a.md', stepText: 'Do thing', stepLine: 3 }],
        spec: [{ taskPath: '.aide/specs/foo/tasks.md', taskText: 'Fix bug' }],
      },
    })
    const files = [
      {
        name: '.aide/plans/a.md',
        content: '# Plan\n\n- [ ] Do thing\n',
      },
      {
        name: '.aide/specs/foo/tasks.md',
        content: '- [ ] Fix bug\n',
      },
    ]
    const result = buildQueueRestoreFromReport(md, files)
    expect(result.planItems).toHaveLength(1)
    expect(result.specItems).toHaveLength(1)
    expect(result.unresolved).toHaveLength(0)
  })

  it('falls back to preview text when hints missing', () => {
    const md = [
      '# Queue Execution Report',
      '',
      '### Plan Preview',
      '- 1. Fallback step',
      '',
      '### Spec Preview',
      '- None',
    ].join('\n')
    const files = [{ name: '.aide/plans/p.md', content: '- [ ] Fallback step\n' }]
    const result = buildQueueRestoreFromReport(md, files)
    expect(result.planItems[0]?.backfill.stepText).toBe('Fallback step')
  })
})
