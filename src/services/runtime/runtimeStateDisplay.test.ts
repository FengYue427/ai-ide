import { describe, expect, it } from 'vitest'
import { formatRuntimeStateDisplayLines } from './runtimeStateDisplay'
import type { RuntimeStateDocument } from './runtimeState'

describe('runtimeStateDisplay', () => {
  it('formats localized runtime-state summary lines', () => {
    const document: RuntimeStateDocument = {
      version: 1,
      activeSpecPath: '.aide/specs/demo/tasks.md',
      queueSnapshot: { specPending: 2, planPending: 1 },
      lastHookResults: [{ hookId: 'lint-gate', at: '2026-06-05T10:00:00Z', status: 'ok' }],
      updatedAt: '2026-06-05T10:00:05Z',
    }

    const lines = formatRuntimeStateDisplayLines(document, (key, params) => `${key}:${JSON.stringify(params)}`)
    expect(lines.some((line) => line.includes('runtime.state.activeSpec'))).toBe(true)
    expect(lines.some((line) => line.includes('demo'))).toBe(true)
    expect(lines.some((line) => line.includes('runtime.state.queue'))).toBe(true)
  })
})
