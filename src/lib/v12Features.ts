/** v1.2 — feature flags. See docs/V1.2_ENV.md · v1.2.6 production safe-defaults */

const MULTI_ROOT_LS_KEY = 'ai-ide:feature:multiRoot'
const PLUGIN_TRUST_LS_KEY = 'ai-ide:feature:pluginTrustMarket'

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

function isProductionRuntime(): boolean {
  return import.meta.env.PROD && import.meta.env.MODE !== 'test'
}

export interface V12FeatureStatus {
  multiRoot: boolean
  virtualFileTree: boolean
  pluginTrustMarket: boolean
}

export function getV12FeatureStatus(): V12FeatureStatus {
  return {
    multiRoot: isMultiRootWorkspaceEnabled(),
    virtualFileTree: isVirtualFileTreeEnabled(),
    pluginTrustMarket: isPluginTrustMarketEnabled(),
  }
}

export function isMultiRootWorkspaceEnabled(): boolean {
  if (import.meta.env.VITE_MULTI_ROOT === 'true') return true
  if (import.meta.env.VITE_MULTI_ROOT === 'false') return false
  if (isDevRuntime()) return true
  if (isProductionRuntime()) return true
  return readLocalFeatureFlag(MULTI_ROOT_LS_KEY)
}

/** E2E / manual: localStorage.setItem('ai-ide:feature:multiRoot', '1') */
export function enableMultiRootForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MULTI_ROOT_LS_KEY, '1')
  }
}

export function isPluginTrustMarketEnabled(): boolean {
  if (import.meta.env.VITE_PLUGIN_TRUST_MARKET === 'true') return true
  if (import.meta.env.VITE_PLUGIN_TRUST_MARKET === 'false') return false
  return readLocalFeatureFlag(PLUGIN_TRUST_LS_KEY)
}

/** E2E / manual: localStorage.setItem('ai-ide:feature:pluginTrustMarket', '1') */
export function enablePluginTrustMarketForSession(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PLUGIN_TRUST_LS_KEY, '1')
  }
}

export function isVirtualFileTreeEnabled(): boolean {
  if (import.meta.env.VITE_VIRTUAL_FILE_TREE === 'true') return true
  if (import.meta.env.VITE_VIRTUAL_FILE_TREE === 'false') return false
  if (isDevRuntime()) return true
  return isMultiRootWorkspaceEnabled()
}

export function shouldUseVirtualFileTree(rowCount: number): boolean {
  return isVirtualFileTreeEnabled() && rowCount >= 500
}
