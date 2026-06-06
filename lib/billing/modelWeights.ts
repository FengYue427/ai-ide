import type { PlatformProviderId } from '../api/aiGateway/platformCatalog'

export type ModelTier = 'economy' | 'standard' | 'premium' | 'frontier'

const TIER_WEIGHT: Record<ModelTier, number> = {
  economy: 1,
  standard: 2,
  premium: 5,
  frontier: 10,
}

const FRONTIER_PATTERNS = [
  /o3/i,
  /opus/i,
  /r1/i,
  /reasoning/i,
  /thinking/i,
  /gpt-5\.4-pro/i,
  /gpt-5\.4-thinking/i,
  /gemini-3\.1-pro/i,
  /glm-5\.1/i,
  /glm-5$/i,
  /qwen-3\.5-max/i,
  /minimax-m2\.5$/i,
  /grok-4\.20-reasoning/i,
]

const PREMIUM_PATTERNS = [
  /gpt-4o(?!-mini)/i,
  /gpt-5(?!\.)/i,
  /sonnet/i,
  /gemini-2\.5-pro/i,
  /gemini-3-flash/i,
  /deepseek-v4-pro/i,
  /deepseek-v3\.2/i,
  /glm-4-plus/i,
  /qwen-3\.5-plus/i,
]

const STANDARD_PATTERNS = [
  /mini/i,
  /haiku/i,
  /plus/i,
  /4o-mini/i,
  /deepseek-chat/i,
  /deepseek-coder/i,
  /qwen-3\.5-9b/i,
  /minimax-m2\.5-lightning/i,
  /grok-4\.20$/i,
]

const ECONOMY_PATTERNS = [
  /flash/i,
  /lite/i,
  /2b/i,
  /4b/i,
  /deepseek-v4-flash/i,
  /glm-4-flash/i,
]

export function getModelTier(provider: string, model: string): ModelTier {
  const haystack = `${provider}:${model}`.toLowerCase()

  if (FRONTIER_PATTERNS.some((pattern) => pattern.test(haystack))) return 'frontier'
  if (PREMIUM_PATTERNS.some((pattern) => pattern.test(haystack))) return 'premium'
  if (STANDARD_PATTERNS.some((pattern) => pattern.test(haystack))) return 'standard'
  if (ECONOMY_PATTERNS.some((pattern) => pattern.test(haystack))) return 'economy'

  return 'standard'
}

export function getModelWeight(provider: string, model: string): number {
  return TIER_WEIGHT[getModelTier(provider, model)]
}

export function isModelTierAllowedForPlan(tier: ModelTier, planName: string): boolean {
  const plan = planName.toLowerCase()
  if (plan === 'free') return tier === 'economy'
  return true
}

export function isPlatformModelAllowedForPlan(
  provider: PlatformProviderId | string,
  model: string,
  planName: string,
): boolean {
  return isModelTierAllowedForPlan(getModelTier(provider, model), planName)
}

export function describeModelTier(tier: ModelTier): string {
  return tier
}
