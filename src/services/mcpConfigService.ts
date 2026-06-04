import { unifiedStorage, StorageLayer } from './unifiedStorage'
import { listMcpTools } from './mcpClientService'
import type { McpServerConfig } from './mcpTypes'

const MCP_STORAGE_KEY = 'mcp-servers'
const MCP_SETTINGS_KEY = 'mcp-settings'
const MCP_TOOL_COUNT_CACHE_KEY = 'ai-ide:mcp-tool-count-estimate'

export interface McpSettings {
  autoFollowUp: boolean
  maxFollowUpRounds: number
}

const DEFAULT_MCP_SETTINGS: McpSettings = {
  autoFollowUp: true,
  maxFollowUpRounds: 2,
}

let cache: McpServerConfig[] | null = null
let settingsCache: McpSettings | null = null

export async function loadMcpServers(): Promise<McpServerConfig[]> {
  if (cache) return cache.map((server) => ({ ...server }))
  const stored = await unifiedStorage.get<McpServerConfig[] | null>(MCP_STORAGE_KEY, null)
  cache = stored ?? []
  return cache.map((server) => ({ ...server }))
}

export function getMcpServersSync(): McpServerConfig[] {
  return (cache ?? []).map((server) => ({ ...server }))
}

export async function saveMcpServers(servers: McpServerConfig[]): Promise<void> {
  cache = servers.map((server) => ({ ...server }))
  await unifiedStorage.set(MCP_STORAGE_KEY, cache, { layer: StorageLayer.LOCAL })
}

export async function getEnabledMcpServers(): Promise<McpServerConfig[]> {
  const servers = await loadMcpServers()
  return servers.filter((server) => server.enabled && server.url.trim())
}

export function createMcpServerDraft(name = 'MCP Server', url = ''): McpServerConfig {
  return {
    id: `mcp-${Date.now().toString(36)}`,
    name,
    url,
    enabled: true,
    headers: {},
  }
}

export function createMcpServerFromPreset(
  presetId: string,
  name: string,
  url: string,
): McpServerConfig {
  return {
    id: `mcp-preset-${presetId}-${Date.now().toString(36)}`,
    name,
    url,
    enabled: false,
    headers: {},
  }
}

export async function loadMcpSettings(): Promise<McpSettings> {
  if (settingsCache) return { ...settingsCache }
  const stored = await unifiedStorage.get<McpSettings | null>(MCP_SETTINGS_KEY, null)
  settingsCache = { ...DEFAULT_MCP_SETTINGS, ...(stored ?? {}) }
  return { ...settingsCache }
}

export async function saveMcpSettings(settings: McpSettings): Promise<void> {
  settingsCache = { ...settings }
  await unifiedStorage.set(MCP_SETTINGS_KEY, settingsCache, { layer: StorageLayer.LOCAL })
}

/** Persist last known MCP tool count for sync payload meter (v1.2.9 F2). */
export function setMcpToolCountEstimate(count: number): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MCP_TOOL_COUNT_CACHE_KEY, String(Math.max(0, Math.floor(count))))
}

export function getMcpToolCountEstimateSync(): number | undefined {
  if (typeof localStorage === 'undefined') return undefined
  const raw = localStorage.getItem(MCP_TOOL_COUNT_CACHE_KEY)
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/** List tools on enabled servers and refresh cached count for payload reserve. */
export async function refreshMcpToolCountEstimate(): Promise<number> {
  const servers = await getEnabledMcpServers()
  if (servers.length === 0) {
    setMcpToolCountEstimate(0)
    return 0
  }

  let total = 0
  for (const server of servers) {
    try {
      const tools = await listMcpTools(server)
      total += tools.length
    } catch {
      total += 4
    }
  }
  setMcpToolCountEstimate(total)
  return total
}
