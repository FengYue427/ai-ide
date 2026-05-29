import { describe, expect, it } from 'vitest'
import {
  buildQueueExecutionReportMarkdown,
  buildQueueReportPath,
  upsertQueueReportFile,
} from './queueExecutionReportService'

describe('queueExecutionReportService', () => {
  it('builds report path under .aide/reports', () => {
    const path = buildQueueReportPath(new Date('2026-05-28T14:00:00.000Z'))
    expect(path).toMatch(/^\.aide\/reports\/queue-/)
  })

  it('builds markdown with queue stats and previews', () => {
    const md = buildQueueExecutionReportMarkdown({
      sessionStatus: 'queued',
      runId: 'run-1',
      activeTask: 'Plan：step A',
      success: { plan: 2, spec: 1 },
      failure: { plan: 0, spec: 1 },
      recentDone: [{ kind: 'plan', text: 'step A' }],
      pending: {
        planQueue: 1,
        specQueue: 2,
        sendQueue: 0,
        planPreview: ['next plan'],
        specPreview: ['next spec'],
      },
      failedSpec: { taskText: 'broken', error: 'timeout' },
      now: new Date('2026-05-28T14:00:00.000Z'),
    })
    expect(md).toContain('Queue Execution Report')
    expect(md).toContain('Success: Plan 2, Spec 1')
    expect(md).toContain('next plan')
    expect(md).toContain('broken')
  })

  it('upserts report file into workspace files', () => {
    const files = [{ name: 'index.js', content: '', language: 'javascript' }]
    const result = upsertQueueReportFile(files, '# report', '.aide/reports/queue-test.md')
    expect(result.files).toHaveLength(2)
    expect(result.index).toBe(1)
    expect(result.files[1].content).toBe('# report')
  })
})
