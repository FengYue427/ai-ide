import { unifiedStorage, StorageLayer } from './unifiedStorage'
import type { McpServerConfig } from './mcpTypes'

const MCP_STORAGE_KEY = 'mcp-servers'
const MCP_SETTINGS_KEY = 'mcp-settings'

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
