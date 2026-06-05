import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseHooksYaml } from '../services/runtime/hooksSchema'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { parseRuntimeStateJson } from '../services/runtime/runtimeState'
import { isTabPlusPlusPocEnabled } from './tabPlusPlusPoc'

const DOCS_ROOT = join(process.cwd(), 'docs')

const REQUIRED_DOCS = [
  'V1.5_F1_TAB_PLUS_PLUS.md',
  'AIDE_RUNTIME.md',
  'ACTIVITY_LINE.md',
  'ADR_V1.5_AIDE_RUNTIME.md',
  'V1.5_KICKOFF.md',
  'ROADMAP_V1.5.md',
]

describe('v149Closeout', () => {
  it('keeps v1.4.x pre-research docs on disk', () => {
    for (const name of REQUIRED_DOCS) {
      expect(existsSync(join(DOCS_ROOT, name)), `missing ${name}`).toBe(true)
    }
  })

  it('keeps runtime modules importable (stub/schema only)', () => {
    expect(getOrchestratorMode()).toBe('stub')
    const hooks = parseHooksYaml(`version: 1
hooks:
  - id: lint
    on: queue.before
    run: shell
    command: npm run lint`)
    expect(hooks.ok).toBe(true)
    const state = parseRuntimeStateJson('{"version":1,"queueSnapshot":{"specPending":0,"planPending":0}}')
    expect(state.ok).toBe(true)
  })

  it('keeps Tab++ POC off by default in test runtime', () => {
    expect(isTabPlusPlusPocEnabled()).toBe(false)
  })
})
