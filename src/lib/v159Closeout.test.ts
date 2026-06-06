import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { evaluateReleaseGateCounts } from './releaseGates'
import { getV15FeatureStatus } from './v15Features'

const DOCS_ROOT = join(process.cwd(), 'docs')

const V159_DOCS = [
  'V1.5.9_GA_EXECUTION.md',
  'V1.5.9_SMOKE_WEEKLY.md',
  'RELEASE_NOTES_v1.5.8.md',
  'RELEASE_NOTES_v1.5.9.md',
  'ROADMAP_V1.5.x_PATCHES.md',
  'COMPETITOR_SCORE_V1.5.md',
  'V1.6_KICKOFF.md',
  'ROADMAP_V1.6.md',
]

describe('v159Closeout', () => {
  it('keeps v1.5.9 closeout docs on disk', () => {
    for (const name of V159_DOCS) {
      expect(existsSync(join(DOCS_ROOT, name)), `missing ${name}`).toBe(true)
    }
  })

  it('documents release gate thresholds', () => {
    const result = evaluateReleaseGateCounts({ unit: 800, e2e: 64 })
    expect(result.ok).toBe(true)
  })

  it('summarizes v1.5 production feature flags', () => {
    const status = getV15FeatureStatus()
    expect(status.byokLegacy).toBe(false)
    expect(typeof status.activityLine).toBe('boolean')
    expect(typeof status.aideRuntime).toBe('boolean')
  })
})
