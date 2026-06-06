import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getV15FeatureStatus } from './v15Features'
import { getOrchestratorMode } from '../services/runtime/runtimeOrchestrator'
import { parseAcceptanceMarkdown } from '../services/runtime/acceptanceRunner'
import { PLATFORM_CLOUD_PROVIDERS } from './platformModelCatalog'

const DOCS_ROOT = join(process.cwd(), 'docs')

const F8_DOCS = [
  'COMPETITOR_SCORE_V1.5.md',
  'V1.6_KICKOFF.md',
  'ROADMAP_V1.6.md',
  'V1.5_GA_EXECUTION.md',
  'V1.5_ENV.md',
  'RELEASE_NOTES_v1.5.0.md',
]

describe('v15Closeout F8', () => {
  it('keeps v1.5 GA and F8 docs on disk', () => {
    for (const name of F8_DOCS) {
      expect(existsSync(join(DOCS_ROOT, name)), `missing ${name}`).toBe(true)
    }
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
