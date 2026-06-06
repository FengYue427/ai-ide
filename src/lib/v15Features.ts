/** v1.5 — feature flags. See docs/V1.5_KICKOFF.md */

import { isTabPlusPlusPocEnabled } from './tabPlusPlusPoc'

const TAB_PLUS_PLUS_LS = 'ai-ide:feature:tabPlusPlus'

export const TAB_PLUS_PLUS_PRODUCTION_DEBOUNCE_MS = 250
export const TAB_PLUS_PLUS_PRODUCTION_MAX_LINES = 8
export const TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS = 400

function readLocalFeatureFlag(key: string): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function isDevRuntime(): boolean {
  return import.meta.env.DEV && import.meta.env.MODE !== 'test'
}

function isV15ProductionBuild(): boolean {
  return Boolean(import.meta.env.PROD) && import.meta.env.MODE !== 'test'
}

function readEnvFlag(name: string, sessionKey: string): boolean {
  const raw = import.meta.env[name]
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  if (isDevRuntime()) return true
  // v1.5.2: production builds default v1.5 flags ON unless explicitly false.
  if (isV15ProductionBuild()) return true
  return readLocalFeatureFlag(sessionKey)
}

export function isV15ProductionDefaultsActive(): boolean {
  return isV15ProductionBuild()
}

export function isByokLegacyAllowed(): boolean {
  return import.meta.env.VITE_ALLOW_BYOK_LEGACY === 'true'
}

/** v1.5 F1 — production Tab++ (multiline ghost + FIM middle). */
export function isTabPlusPlusProductionEnabled(): boolean {
  return readEnvFlag('VITE_TAB_PLUS_PLUS', TAB_PLUS_PLUS_LS)
}

/** POC or production Tab++ ghost layout. */
export function isTabPlusPlusEnabled(): boolean {
  return isTabPlusPlusPocEnabled() || isTabPlusPlusProductionEnabled()
}

/** v1.5 F5 — Activity Line production flag. See docs/ACTIVITY_LINE.md */

const AIDE_ACTIVITY_LINE_LS = 'ai-ide:feature:aideActivityLine'

export function isActivityLineProductionEnabled(): boolean {
  return readEnvFlag('VITE_AIDE_ACTIVITY_LINE', AIDE_ACTIVITY_LINE_LS)
}

export interface V15FeatureStatus {
  tabPlusPlus: boolean
  tabPlusPlusProduction: boolean
  byokLegacy: boolean
  activityLine: boolean
  specArtifactsV2: boolean
  aideRuntime: boolean
}

export function isSpecArtifactsV2Enabled(): boolean {
  return readEnvFlag('VITE_AIDE_SPEC_ARTIFACTS_V2', 'ai-ide:feature:specArtifactsV2')
}

/** v1.5 F4 — production runtime engine (orchestrator + hookRunner). */
export function isAideRuntimeProductionEnabled(): boolean {
  return readEnvFlag('VITE_AIDE_RUNTIME', 'ai-ide:feature:aideRuntime')
}

export function getV15FeatureStatus(): V15FeatureStatus {
  return {
    tabPlusPlus: isTabPlusPlusEnabled(),
    tabPlusPlusProduction: isTabPlusPlusProductionEnabled(),
    byokLegacy: isByokLegacyAllowed(),
    activityLine: isActivityLineProductionEnabled(),
    specArtifactsV2: isSpecArtifactsV2Enabled(),
    aideRuntime: isAideRuntimeProductionEnabled(),
  }
}
