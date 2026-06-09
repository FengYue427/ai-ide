import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getV15FeatureStatus } from './v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { parseAcceptanceMarkdown } from '../services/runtime/acceptanceRunner'
import { PLATFORM_CLOUD_PROVIDERS } from './platformModelCatalog'

const DOCS_ROOT = join(process.cwd(), 'docs')

describe('v15Closeout F8', () => {
  it('keeps slim docs footprint after v1.7 cleanup', () => {
    expect(existsSync(join(DOCS_ROOT, 'DEPLOY_ALIYUN_CN.md'))).toBe(true)
  })

  it('summarizes v1.5 feature flags', () => {
    const status = getV15FeatureStatus()
    expect(status.byokLegacy).toBe(false)
    expect(typeof status.tabPlusPlusProduction).toBe('boolean')
    expect(typeof status.aideRuntime).toBe('boolean')
  })

  it('keeps runtime and acceptance modules importable', () => {
    expect(['stub', 'production']).toContain(getOrchestratorMode())
    const parsed = parseAcceptanceMarkdown('- [ ] login\n```aide-acceptance\n- npm test\n```')
    expect(parsed.uncheckedItems).toContain('login')
    expect(parsed.commandBlocks[0]?.commands[0]).toBe('npm test')
  })

  it('exposes platform model catalog for F0', () => {
    expect(PLATFORM_CLOUD_PROVIDERS.length).toBeGreaterThanOrEqual(6)
  })
})
