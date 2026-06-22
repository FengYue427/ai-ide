import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseHooksYaml } from '../services/runtime/hooksSchema'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { parseRuntimeStateJson } from '../services/runtime/runtimeState'
import { isTabPlusPlusPocEnabled } from './tabPlusPlusPoc'

const DOCS_ROOT = join(process.cwd(), 'docs')

describe('v149Closeout', () => {
  it('keeps slim docs footprint after v1.7 cleanup', () => {
    const p0Docs = [
      'DEPLOY_ALIYUN_CN.md',
      'CN_LAUNCH_P0.md',
      'ENV_PRODUCTION.md',
      'OBSERVABILITY.md',
      'PLAN_SYSTEM_QUICKSTART.md',
      'RELEASE_RUNBOOK.md',
    ]
    for (const name of p0Docs) {
      expect(existsSync(join(DOCS_ROOT, name))).toBe(true)
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
