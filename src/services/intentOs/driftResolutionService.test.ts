import { describe, expect, it } from 'vitest'
import { buildDriftResolutionActions } from './driftResolutionService'

describe('driftResolutionService', () => {
  it('builds open tasks and acceptance actions', () => {
    const actions = buildDriftResolutionActions(
      {
        tasksPath: '.aide/specs/demo/tasks.md',
        scannedAt: '2026-01-01',
        severity: 'info',
        items: [
          { kind: 'open-task', message: '1 open', count: 1 },
          { kind: 'open-acceptance', message: '2 open', path: '.aide/specs/demo/acceptance.md', count: 2 },
        ],
      },
      [
        { name: '.aide/specs/demo/requirements.md', content: '# req', language: 'markdown' },
        {
          name: '.aide/reports/proof-demo.md',
          content: '- Tasks Path: .aide/specs/demo/tasks.md\n',
          language: 'markdown',
        },
      ],
    )
    expect(actions.some((a) => a.kind === 'open-tasks')).toBe(true)
    expect(actions.some((a) => a.kind === 'open-acceptance')).toBe(true)
    expect(actions.some((a) => a.kind === 'open-requirements')).toBe(true)
    expect(actions.some((a) => a.kind === 'open-proof')).toBe(true)
  })
})
