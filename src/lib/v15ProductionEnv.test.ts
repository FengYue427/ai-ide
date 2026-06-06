import { describe, expect, it } from 'vitest'
import { V15_PRODUCTION_SERVER_FLAGS, V15_PRODUCTION_VITE_FLAGS } from './v15ProductionEnv'

describe('v15ProductionEnv', () => {
  it('lists required v1.5 Vite build flags for production deploy', () => {
    expect(V15_PRODUCTION_VITE_FLAGS.map((f) => f.name)).toEqual([
      'VITE_AI_GATEWAY',
      'VITE_ALLOW_BYOK_LEGACY',
      'VITE_TAB_PLUS_PLUS',
      'VITE_AIDE_SPEC_ARTIFACTS_V2',
      'VITE_AIDE_RUNTIME',
      'VITE_AIDE_ACTIVITY_LINE',
    ])
    expect(V15_PRODUCTION_VITE_FLAGS.find((f) => f.name === 'VITE_AI_GATEWAY')?.required).toBe(true)
    expect(V15_PRODUCTION_VITE_FLAGS.find((f) => f.name === 'VITE_ALLOW_BYOK_LEGACY')?.mustBe).toBe('false')
  })

  it('lists recommended server env for v1.5 production', () => {
    expect(V15_PRODUCTION_SERVER_FLAGS.map((f) => f.name)).toContain('DATABASE_URL')
    expect(V15_PRODUCTION_SERVER_FLAGS.map((f) => f.name)).toContain('AUTH_SECRET')
  })
})
