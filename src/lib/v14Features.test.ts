import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enableBackgroundAgentProductionForSession,
  enableIndex2kProductionForSession,
  enableMcpPluginProductionForSession,
  enableTabFimProductionForSession,
  getIndexWorkerMinSources,
  getV14FeatureStatus,
  isBackgroundAgentProductionEnabled,
  isGitHunkStageEnabled,
  isIndex2kProductionEnabled,
  isMcpPluginProductionEnabled,
  isTabFimProductionEnabled,
} from './v14Features'

const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
})

describe('v14Features', () => {
  beforeEach(() => {
    storage.clear()
    delete import.meta.env.VITE_TAB_FIM_PRODUCTION
    delete import.meta.env.VITE_INDEX_2K_PRODUCTION
    delete import.meta.env.VITE_BACKGROUND_AGENT_PRODUCTION
    delete import.meta.env.VITE_MCP_PLUGIN_PRODUCTION
    delete import.meta.env.VITE_GIT_HUNK_STAGE
  })

  it('is disabled by default in test runtime', () => {
    expect(isTabFimProductionEnabled()).toBe(false)
    expect(isIndex2kProductionEnabled()).toBe(false)
    expect(isBackgroundAgentProductionEnabled()).toBe(false)
    expect(isMcpPluginProductionEnabled()).toBe(false)
  })

  it('can be enabled for current session via localStorage', () => {
    enableTabFimProductionForSession()
    enableIndex2kProductionForSession()
    enableBackgroundAgentProductionForSession()
    enableMcpPluginProductionForSession()
    const status = getV14FeatureStatus()
    expect(status.tabFimProduction).toBe(true)
    expect(status.index2kProduction).toBe(true)
    expect(status.backgroundAgentProduction).toBe(true)
    expect(status.mcpPluginProduction).toBe(true)
    expect(getIndexWorkerMinSources()).toBe(40)
  })

  it('enables git hunk stage by default unless env disables', () => {
    expect(isGitHunkStageEnabled()).toBe(true)
    import.meta.env.VITE_GIT_HUNK_STAGE = 'false'
    expect(isGitHunkStageEnabled()).toBe(false)
    delete import.meta.env.VITE_GIT_HUNK_STAGE
  })
})
