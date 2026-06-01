import { describe, expect, it, vi } from 'vitest'
import {
  isMultiRootWorkspaceEnabled,
  isPluginTrustMarketEnabled,
  isVirtualFileTreeEnabled,
  shouldUseVirtualFileTree,
} from './v12Features'

describe('v12Features', () => {
  it('defaults off when env unset', () => {
    vi.stubEnv('VITE_MULTI_ROOT', '')
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', '')
    vi.stubEnv('VITE_VIRTUAL_FILE_TREE', '')
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ai-ide:feature:multiRoot')
      localStorage.removeItem('ai-ide:feature:pluginTrustMarket')
    }
    expect(isMultiRootWorkspaceEnabled()).toBe(false)
    expect(isPluginTrustMarketEnabled()).toBe(false)
    expect(isVirtualFileTreeEnabled()).toBe(false)
  })

  it('virtual tree when multi-root and row count high', () => {
    vi.stubEnv('VITE_MULTI_ROOT', 'true')
    vi.stubEnv('VITE_VIRTUAL_FILE_TREE', '')
    expect(shouldUseVirtualFileTree(500)).toBe(true)
    expect(shouldUseVirtualFileTree(100)).toBe(false)
    vi.unstubAllEnvs()
  })

  it('enables when env is true', () => {
    vi.stubEnv('VITE_MULTI_ROOT', 'true')
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', 'true')
    vi.stubEnv('VITE_VIRTUAL_FILE_TREE', 'true')
    expect(isMultiRootWorkspaceEnabled()).toBe(true)
    expect(isPluginTrustMarketEnabled()).toBe(true)
    expect(isVirtualFileTreeEnabled()).toBe(true)
  })

  it('enables plugin trust via localStorage flag', () => {
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', '')
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ai-ide:feature:pluginTrustMarket', '1')
      expect(isPluginTrustMarketEnabled()).toBe(true)
      localStorage.removeItem('ai-ide:feature:pluginTrustMarket')
    }
  })
})
