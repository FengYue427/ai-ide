/** v1.3 — feature flags. See docs/V1.3_ENV.md */

const PYTHON_NAV_LS = 'ai-ide:feature:pythonNav'
const EMBEDDING_PERSIST_LS = 'ai-ide:feature:embeddingPersist'
const INDEX_TELEMETRY_LS = 'ai-ide:feature:indexTelemetry'

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

export interface V13FeatureStatus {
  pythonNavigation: boolean
  embeddingPersistCache: boolean
  indexBuildTelemetry: boolean
  backgroundAgent: boolean
}

export function getV13FeatureStatus(): V13FeatureStatus {
  return {
    pythonNavigation: isPythonNavigationEnabled(),
    embeddingPersistCache: isEmbeddingPersistCacheEnabled(),
    indexBuildTelemetry: isIndexBuildTelemetryEnabled(),
    backgroundAgent: import.meta.env.VITE_BACKGROUND_AGENT === 'true',
  }
}

export function isPythonNavigationEnabled(): boolean {
  if (import.meta.env.VITE_PYTHON_NAV === 'true') return true
  if (import.meta.env.VITE_PYTHON_NAV === 'false') return false
  if (isDevRuntime()) return true
  return readLocalFeatureFlag(PYTHON_NAV_LS)
}

export function enablePythonNavigationForSession(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(PYTHON_NAV_LS, '1')
}

export function isEmbeddingPersistCacheEnabled(): boolean {
  if (import.meta.env.VITE_EMBEDDING_PERSIST === 'true') return true
  if (import.meta.env.VITE_EMBEDDING_PERSIST === 'false') return false
  if (isDevRuntime()) return true
  return readLocalFeatureFlag(EMBEDDING_PERSIST_LS)
}

export function isIndexBuildTelemetryEnabled(): boolean {
  if (import.meta.env.VITE_INDEX_TELEMETRY === 'true') return true
  if (import.meta.env.VITE_INDEX_TELEMETRY === 'false') return false
  return isDevRuntime() || readLocalFeatureFlag(INDEX_TELEMETRY_LS)
}
