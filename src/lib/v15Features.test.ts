import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getV15FeatureStatus,
  isAideRuntimeProductionEnabled,
  isByokLegacyAllowed,
  isTabPlusPlusEnabled,
  isTabPlusPlusProductionEnabled,
  isActivityLineProductionEnabled,
  isV15ProductionDefaultsActive,
} from './v15Features'

describe('v15Features', () => {
  afterEach(() => {
    delete import.meta.env.VITE_TAB_PLUS_PLUS
    delete import.meta.env.VITE_ALLOW_BYOK_LEGACY
    delete import.meta.env.VITE_AIDE_ACTIVITY_LINE
    delete import.meta.env.VITE_AIDE_RUNTIME
    delete import.meta.env.VITE_AIDE_SPEC_ARTIFACTS_V2
    vi.unstubAllEnvs()
  })

  it('defaults BYOK legacy to off', () => {
    expect(isByokLegacyAllowed()).toBe(false)
  })

  it('enables Tab++ production from env', () => {
    import.meta.env.VITE_TAB_PLUS_PLUS = 'true'
    expect(isTabPlusPlusProductionEnabled()).toBe(true)
    expect(isTabPlusPlusEnabled()).toBe(true)
    expect(getV15FeatureStatus().tabPlusPlus).toBe(true)
  })

  it('defaults v1.5 flags on in production build when env unset (v1.5.2)', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('DEV', false)
    expect(isV15ProductionDefaultsActive()).toBe(true)
    expect(isTabPlusPlusProductionEnabled()).toBe(true)
    expect(isAideRuntimeProductionEnabled()).toBe(true)
    expect(isActivityLineProductionEnabled()).toBe(true)
  })

  it('respects explicit false in production build', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('MODE', 'production')
    import.meta.env.VITE_TAB_PLUS_PLUS = 'false'
    expect(isTabPlusPlusProductionEnabled()).toBe(false)
  })

  it('accepts numeric 1 for env flags', () => {
    import.meta.env.VITE_TAB_PLUS_PLUS = '1'
    expect(isTabPlusPlusProductionEnabled()).toBe(true)
  })

  it('enables Activity Line production from env', () => {
    import.meta.env.VITE_AIDE_ACTIVITY_LINE = 'true'
    expect(isActivityLineProductionEnabled()).toBe(true)
    expect(getV15FeatureStatus().activityLine).toBe(true)
  })

  it('enables AIDE Runtime production from env', () => {
    import.meta.env.VITE_AIDE_RUNTIME = 'true'
    expect(isAideRuntimeProductionEnabled()).toBe(true)
    expect(getV15FeatureStatus().aideRuntime).toBe(true)
  })

  it('summarizes v1.5 feature status', () => {
    import.meta.env.VITE_TAB_PLUS_PLUS = 'true'
    import.meta.env.VITE_AIDE_SPEC_ARTIFACTS_V2 = 'true'
    const status = getV15FeatureStatus()
    expect(status.tabPlusPlusProduction).toBe(true)
    expect(status.byokLegacy).toBe(false)
    expect(status.specArtifactsV2).toBe(true)
  })
})
