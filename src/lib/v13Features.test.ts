import { describe, expect, it } from 'vitest'
import { getV13FeatureStatus } from './v13Features'

describe('v13Features', () => {
  it('reports feature status shape', () => {
    const status = getV13FeatureStatus()
    expect(typeof status.pythonNavigation).toBe('boolean')
    expect(typeof status.embeddingPersistCache).toBe('boolean')
    expect(typeof status.indexBuildTelemetry).toBe('boolean')
    expect(typeof status.backgroundAgent).toBe('boolean')
  })
})
