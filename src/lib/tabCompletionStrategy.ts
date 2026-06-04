import { shouldUsePlatformAi } from './aiPlatformMode'
import type { AIConfig } from '../services/aiService'
import { supportsFimApi } from '../services/fimCompletionService'

export type TabCompletionStrategy = 'fim' | 'platform' | 'chat' | 'none'

/** Ordered resolution: FIM (BYOK) → platform AI → chat fallback. */
export function resolveTabCompletionStrategy(
  config: AIConfig,
  loggedIn: boolean,
): TabCompletionStrategy {
  if (config.provider === 'ollama') return 'fim'
  if (supportsFimApi(config.provider) && config.apiKey?.trim()) return 'fim'
  if (shouldUsePlatformAi(config, loggedIn)) return 'platform'
  if (config.apiKey?.trim()) return 'chat'
  return 'none'
}

export function describeTabCompletionStrategy(
  config: AIConfig,
  loggedIn: boolean,
): 'fim' | 'platform' | 'chat' | 'off' {
  const strategy = resolveTabCompletionStrategy(config, loggedIn)
  if (strategy === 'none') return 'off'
  return strategy
}
