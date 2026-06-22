import {
  getPlanLimitsFromEntitlements,
  getPlanMarketingFeatures,
} from './entitlements'

export interface PlanDefinition {
  id: string
  name: string
  displayName: string
  description: string
  /** Display & Stripe catalog price (USD when currency is USD). */
  price: number
  currency: string
  /** CNY price in yuan for Alipay/WeChat (optional while Stripe is primary). */
  priceCny?: number
  features: string[]
  limits: {
    aiRequestsPerDay: number
    workspaces: number
    storageGB: number
  }
}

/** Stripe global pricing (USD/mo). CN merchants use priceCny when enabled. */
export const STRIPE_USD_PRO = 9.99
export const STRIPE_USD_ENTERPRISE = 19.99

function buildPlanDefinition(
  id: PlanDefinition['name'],
  displayName: string,
  description: string,
  price: number,
  priceCny: number | undefined,
): PlanDefinition {
  return {
    id,
    name: id,
    displayName,
    description,
    price,
    currency: 'USD',
    priceCny,
    features: getPlanMarketingFeatures(id),
    limits: getPlanLimitsFromEntitlements(id),
  }
}

/** v1.5 weighted quota units/day; Pro $9.99/mo · Team $19.99/mo. Limits from entitlements.ts. */
export const BILLING_PLANS: PlanDefinition[] = [
  buildPlanDefinition('free', '免费版', '个人学习与日常小项目', 0, undefined),
  buildPlanDefinition('pro', '专业版', '个人工程闭环 — Autopilot · 证明包 · 全档 AI', STRIPE_USD_PRO, 39),
  buildPlanDefinition(
    'enterprise',
    '团队版',
    '协作交付 — 长链 Share · 批量 Agent · 团队房间',
    STRIPE_USD_ENTERPRISE,
    79,
  ),
]

export function getBillablePlanNames(): string[] {
  return BILLING_PLANS.filter((plan) => plan.name !== 'free').map((plan) => plan.name)
}

export function findPlanByName(name: string): PlanDefinition | undefined {
  return BILLING_PLANS.find((plan) => plan.name === name || plan.id === name)
}

export function getPlanLimits(planName: string): PlanDefinition['limits'] {
  return getPlanLimitsFromEntitlements(planName)
}

export function getWorkspaceLimit(planName: string): number {
  return getPlanLimits(planName).workspaces
}

export function getStorageLimitGb(planName: string): number {
  return getPlanLimits(planName).storageGB
}

export function getStripePriceId(planName: string): string | undefined {
  if (planName === 'pro') return process.env.STRIPE_PRICE_PRO
  if (planName === 'enterprise') return process.env.STRIPE_PRICE_ENTERPRISE
  return undefined
}

export function getPaddlePriceId(planName: string): string | undefined {
  if (planName === 'pro') return process.env.PADDLE_PRICE_PRO?.trim()
  if (planName === 'enterprise') return process.env.PADDLE_PRICE_ENTERPRISE?.trim()
  return undefined
}

/** CNY amount in fen (分) for Alipay/WeChat. */
export function getPlanPriceCny(plan: PlanDefinition): number {
  if (plan.priceCny != null && plan.priceCny > 0) return plan.priceCny
  if (plan.currency === 'CNY' && plan.price > 0) return plan.price
  return 0
}

export function getPlanAmountCents(planName: string): number {
  const plan = findPlanByName(planName)
  if (!plan) return 0
  const yuan = getPlanPriceCny(plan)
  if (yuan <= 0) return 0
  return Math.round(yuan * 100)
}

export type PlanPriceLike = Pick<PlanDefinition, 'name' | 'price' | 'currency'> & { priceCny?: number }

export type PlanDisplayQuote = {
  amount: number
  currency: 'CNY' | 'USD'
  symbol: '¥' | '$'
  formatted: string
}

/** Merge API/DB plan rows with static catalog CNY pricing (¥39 / ¥79). */
export function mergePlanCatalogPricing<T extends PlanPriceLike>(plan: T): T & { priceCny?: number } {
  const catalog = findPlanByName(plan.name)
  return { ...plan, priceCny: plan.priceCny ?? catalog?.priceCny }
}

/** UI quote — prefer CNY when mainland checkout (Alipay/WeChat) is active. */
export function getPlanDisplayQuote(
  plan: PlanPriceLike,
  options?: { preferCny?: boolean; freeLabel?: string },
): PlanDisplayQuote {
  const merged = mergePlanCatalogPricing(plan)
  const freeLabel = options?.freeLabel ?? '免费'

  if (merged.price === 0 && getPlanPriceCny(merged as PlanDefinition) <= 0) {
    return { amount: 0, currency: 'CNY', symbol: '¥', formatted: freeLabel }
  }

  const preferCny = options?.preferCny ?? false
  const cny = getPlanPriceCny(merged as PlanDefinition)
  if (preferCny && cny > 0) {
    return { amount: cny, currency: 'CNY', symbol: '¥', formatted: `¥${cny}` }
  }

  if (merged.currency === 'CNY' && merged.price > 0) {
    return {
      amount: merged.price,
      currency: 'CNY',
      symbol: '¥',
      formatted: `¥${merged.price}`,
    }
  }

  const n = merged.price
  const formatted = Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
  return { amount: n, currency: 'USD', symbol: '$', formatted }
}

export function formatPlanPrice(
  plan: PlanDefinition,
  options?: { preferCny?: boolean; freeLabel?: string },
): string {
  return getPlanDisplayQuote(plan, options).formatted
}

/** Build { planName: limits } map for client services. */
export function planLimitsByName(): Record<string, PlanDefinition['limits']> {
  return Object.fromEntries(BILLING_PLANS.map((p) => [p.name, p.limits]))
}
