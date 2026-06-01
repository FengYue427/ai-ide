import type { AIConfig } from '../services/aiService'

export type AiKeyMode = 'byok' | 'platform'

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
