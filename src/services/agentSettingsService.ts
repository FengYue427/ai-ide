import { unifiedStorage, StorageLayer } from './unifiedStorage'

const AGENT_SETTINGS_KEY = 'agent-settings'

export interface AgentSettings {
  /** Use OpenAI-style tool loop when the provider supports it */
  useToolLoop: boolean
  /** Apply write_file immediately; false = stage for Diff preview */
  autoApplyWrites: boolean
  maxRounds: number
  /** Inject recent terminal lines into Agent/Chat system context (1.0.4) */
  injectTerminalContext: boolean
  terminalContextMaxLines: number
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  useToolLoop: true,
  autoApplyWrites: false,
  maxRounds: 10,
  injectTerminalContext: false,
  terminalContextMaxLines: 24,
}

let settingsCache: AgentSettings | null = null

export async function loadAgentSettings(): Promise<AgentSettings> {
  if (settingsCache) return { ...settingsCache }
  const stored = await unifiedStorage.get<Partial<AgentSettings> | null>(AGENT_SETTINGS_KEY, null)
  settingsCache = {
    ...DEFAULT_AGENT_SETTINGS,
    ...(stored ?? {}),
    maxRounds: Math.min(16, Math.max(1, stored?.maxRounds ?? DEFAULT_AGENT_SETTINGS.maxRounds)),
    terminalContextMaxLines: Math.min(
      80,
      Math.max(4, stored?.terminalContextMaxLines ?? DEFAULT_AGENT_SETTINGS.terminalContextMaxLines),
    ),
    injectTerminalContext: stored?.injectTerminalContext ?? DEFAULT_AGENT_SETTINGS.injectTerminalContext,
  }
  return { ...settingsCache }
}

export async function saveAgentSettings(settings: AgentSettings): Promise<void> {
  settingsCache = {
    ...settings,
    maxRounds: Math.min(16, Math.max(1, settings.maxRounds)),
    terminalContextMaxLines: Math.min(80, Math.max(4, settings.terminalContextMaxLines)),
  }
  await unifiedStorage.set(AGENT_SETTINGS_KEY, settingsCache, { layer: StorageLayer.LOCAL })
}

export function getAgentSettingsSync(): AgentSettings {
  return { ...(settingsCache ?? DEFAULT_AGENT_SETTINGS) }
}
