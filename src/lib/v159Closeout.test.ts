import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { evaluateReleaseGateCounts, RELEASE_GATE_MIN_E2E, RELEASE_GATE_MIN_UNIT } from './releaseGates'
import { getV15FeatureStatus } from './v15Features'

const DOCS_ROOT = join(process.cwd(), 'docs')

describe('v159Closeout', () => {
  it('keeps slim docs footprint after v1.7 cleanup', () => {
    expect(existsSync(join(DOCS_ROOT, 'DEPLOY_ALIYUN_CN.md'))).toBe(true)
  })

  it('documents release gate thresholds', () => {
    const result = evaluateReleaseGateCounts({ unit: RELEASE_GATE_MIN_UNIT, e2e: RELEASE_GATE_MIN_E2E })
    expect(result.ok).toBe(true)
  })

  it('summarizes v1.5 production feature flags', () => {
    const status = getV15FeatureStatus()
    expect(status.byokLegacy).toBe(false)
    expect(typeof status.activityLine).toBe('boolean')
    expect(typeof status.aideRuntime).toBe('boolean')
  })
})
