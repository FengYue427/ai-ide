import { isByokLegacyAllowed } from './v15Features'

export type AiKeyMode = 'byok' | 'platform'

/** Runtime AI source exposed to plugins and diagnostics (SDK 2.0). */
export type AiRuntimeMode = 'platform' | 'byok' | 'ollama' | 'unconfigured'

export function isAiGatewayEnabled(): boolean {
  return import.meta.env.VITE_AI_GATEWAY === 'true'
}

export function shouldUsePlatformAi(config: { provider: string; keyMode?: AiKeyMode }, loggedIn: boolean): boolean {
  if (!isAiGatewayEnabled() || !loggedIn) return false
  if (config.provider === 'ollama') return false
  if (!isByokLegacyAllowed()) return true
  return config.keyMode !== 'byok'
}

/** Chat / Agent can run without a user API key when platform mode is active. */
export function isAiConfigured(
  config: { provider: string; apiKey?: string; keyMode?: AiKeyMode },
  loggedIn: boolean,
): boolean {
  if (config.provider === 'ollama') return true
  if (shouldUsePlatformAi(config, loggedIn)) return true
  if (!isByokLegacyAllowed()) return false
  return Boolean(config.apiKey?.trim())
}

export function getAiRuntimeMode(
  config: { provider: string; apiKey?: string; keyMode?: AiKeyMode },
  loggedIn: boolean,
): AiRuntimeMode {
  if (config.provider === 'ollama') return 'ollama'
  if (shouldUsePlatformAi(config, loggedIn)) return 'platform'
  if (isByokLegacyAllowed() && config.apiKey?.trim()) return 'byok'
  return 'unconfigured'
}
