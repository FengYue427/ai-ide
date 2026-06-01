/** v1.2 — feature flags (default off until GA). See docs/V1.2_ENV.md */

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

export function isMultiRootWorkspaceEnabled(): boolean {
  if (import.meta.env.VITE_MULTI_ROOT === 'true') return true
  if (import.meta.env.VITE_MULTI_ROOT === 'false') return false
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
  return isMultiRootWorkspaceEnabled()
}

export function shouldUseVirtualFileTree(rowCount: number): boolean {
  return isVirtualFileTreeEnabled() && rowCount >= 500
}
