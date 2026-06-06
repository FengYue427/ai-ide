import { describe, expect, it } from 'vitest'
import { RUNTIME_STATE_PATH } from './runtimeState'
import {
  buildRuntimeStateDocument,
  hookResultsFromOutcomes,
  upsertRuntimeStateInFiles,
} from './runtimeStateWriter'

describe('runtimeStateWriter', () => {
  it('builds runtime-state document with hook results', () => {
    const document = buildRuntimeStateDocument({
      activeSpecPath: '.aide/specs/demo/tasks.md',
      queueSnapshot: { specPending: 1, planPending: 0 },
      hookResults: hookResultsFromOutcomes(
        [{ hookId: 'pre-run-tests', status: 'skip' }],
        '.aide/specs/demo/tasks.md',
      ),
    })

    expect(document.version).toBe(1)
    expect(document.activeSpecPath).toContain('demo/tasks.md')
    expect(document.lastHookResults?.[0]?.hookId).toBe('pre-run-tests')
  })

  it('upserts runtime-state.json into workspace files', () => {
    const next = upsertRuntimeStateInFiles(
      [{ name: 'src/app.ts', content: 'export {}', language: 'typescript' }],
      {
        activeSpecPath: '.aide/specs/demo/tasks.md',
        hookResults: hookResultsFromOutcomes([{ hookId: 'after-queue', status: 'ok' }]),
      },
    )

    const row = next.find((file) => file.name === RUNTIME_STATE_PATH)
    expect(row?.language).toBe('json')
    expect(row?.content).toContain('"activeSpecPath"')
  })
})
