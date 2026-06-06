/** v1.5 F0 — client-side platform model catalog mirror. */

import type { AIModel } from '../services/aiService'
import { getModelTier, isModelTierAllowedForPlan, type ModelTier } from '../../lib/billing/modelWeights'

export const PLATFORM_CLOUD_PROVIDERS: readonly AIModel[] = [
  'deepseek',
  'openai',
  'claude',
  'google',
  'qwen',
  'zhipu',
  'minimax',
  'grok',
] as const

export function isPlatformCloudProvider(provider: AIModel): boolean {
  return (PLATFORM_CLOUD_PROVIDERS as readonly string[]).includes(provider)
}

export function getModelTierLabel(provider: AIModel, model: string): ModelTier {
  return getModelTier(provider, model)
}

export function isModelAllowedForUserPlan(
  provider: AIModel,
  model: string,
  planName: string,
): boolean {
  return isModelTierAllowedForPlan(getModelTier(provider, model), planName)
}

export function filterModelsForPlan(
  provider: AIModel,
  models: readonly string[],
  planName: string,
): string[] {
  return models.filter((model) => isModelAllowedForUserPlan(provider, model, planName))
}

export function groupModelsByTier(
  provider: AIModel,
  models: readonly string[],
): Record<ModelTier, string[]> {
  const grouped: Record<ModelTier, string[]> = {
    economy: [],
    standard: [],
    premium: [],
    frontier: [],
  }
  for (const model of models) {
    grouped[getModelTier(provider, model)].push(model)
  }
  return grouped
}

export function formatModelOptionLabel(provider: AIModel, model: string): string {
  const tier = getModelTier(provider, model)
  return `${model} · ${tier}`
}
