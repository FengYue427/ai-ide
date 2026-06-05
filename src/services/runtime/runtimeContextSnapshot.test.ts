import { afterEach, describe, expect, it } from 'vitest'
import { clearRuntimeEvents, publishRuntimeEvent } from './runtimeEventBus'
import { buildRuntimeContextSnapshot } from './runtimeContextSnapshot'

describe('runtimeContextSnapshot', () => {
  afterEach(() => {
    clearRuntimeEvents()
  })

  it('extracts first open task and recent activity', () => {
    publishRuntimeEvent({
      type: 'agent.fileWrite',
      at: 't',
      message: 'wrote index.ts',
    })

    const snapshot = buildRuntimeContextSnapshot(
      [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '# Demo\n\n- [ ] Fix login\n- [ ] Add tests\n',
        },
      ],
      '.aide/specs/demo/tasks.md',
    )

    expect(snapshot.activeSpecPath).toContain('demo')
    expect(snapshot.firstOpenTaskText).toBe('Fix login')
    expect(snapshot.recentActivitySummaries[0]).toContain('index.ts')
  })
})
