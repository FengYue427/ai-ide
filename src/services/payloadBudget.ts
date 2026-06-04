import type { AIModel } from './aiService'

const PAYLOAD_BUDGET_BY_PROVIDER: Partial<Record<AIModel, number>> = {
  openai: 120_000,
  deepseek: 120_000,
  claude: 110_000,
  google: 100_000,
  qwen: 120_000,
  zhipu: 120_000,
  minimax: 110_000,
  grok: 120_000,
  ollama: 180_000,
}

export function getPayloadBudget(provider: AIModel): number {
  return PAYLOAD_BUDGET_BY_PROVIDER[provider] ?? 120_000
}

export function toKb(bytes: number): number {
  return Math.ceil(bytes / 1024)
}

export type PayloadBudgetLevel = 'ok' | 'warn' | 'over'

/** Share ratio with chat payload meter (v1.2.4 F2). */
export const PAYLOAD_BUDGET_WARN_RATIO = 0.82

export function getPayloadBudgetLevel(estimatedBytes: number, budgetBytes: number): PayloadBudgetLevel {
  if (budgetBytes <= 0 || estimatedBytes > budgetBytes) return 'over'
  if (estimatedBytes >= budgetBytes * PAYLOAD_BUDGET_WARN_RATIO) return 'warn'
  return 'ok'
}
