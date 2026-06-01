import type { AIConfig } from '../services/aiService'

export type AiKeyMode = 'byok' | 'platform'

/** Runtime AI source exposed to plugins and diagnostics (SDK 2.0). */
export type AiRuntimeMode = 'platform' | 'byok' | 'ollama' | 'unconfigured'

export function isAiGatewayEnabled(): boolean {
  return import.meta.env.VITE_AI_GATEWAY === 'true'
}

export function shouldUsePlatformAi(config: AIConfig, loggedIn: boolean): boolean {
  if (!isAiGatewayEnabled() || !loggedIn) return false
  if (config.provider === 'ollama') return false
  return config.keyMode === 'platform'
}

/** Chat / Agent can run without a user API key when platform mode is active. */
export function isAiConfigured(
  config: AIConfig,
  loggedIn: boolean,
): boolean {
  if (config.provider === 'ollama') return true
  if (shouldUsePlatformAi(config, loggedIn)) return true
  return Boolean(config.apiKey?.trim())
}

export function getAiRuntimeMode(config: AIConfig, loggedIn: boolean): AiRuntimeMode {
  if (config.provider === 'ollama') return 'ollama'
  if (shouldUsePlatformAi(config, loggedIn)) return 'platform'
  if (config.apiKey?.trim()) return 'byok'
  return 'unconfigured'
}
