export interface PlanDefinition {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  features: string[]
  limits: {
    aiRequestsPerDay: number
    workspaces: number
    storageGB: number
  }
}

/** 默认宽松配额；价格偏低，便于国内用户试用与升级。 */
export const BILLING_PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'free',
    displayName: '免费版',
    description: '个人学习与日常小项目，配额已放宽',
    price: 0,
    currency: 'CNY',
    features: [
      '平台 AI 对话（登录即用，每日 200 次）',
      '可选自带 API Key（BYOK）',
      '最多 10 个云工作区',
      '3GB 云存储额度（规划）',
    ],
    limits: { aiRequestsPerDay: 200, workspaces: 10, storageGB: 3 },
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: '专业版',
    description: '高频个人开发者，高性价比',
    price: 19,
    currency: 'CNY',
    features: [
      '平台 AI + Agent（高配额）',
      '全部模型与 BYOK',
      '无限云工作区',
      '每日 5000 次配额（宽松）',
      '30GB 云存储额度（规划）',
      '支付宝 / 微信订阅',
    ],
    limits: { aiRequestsPerDay: 5000, workspaces: -1, storageGB: 30 },
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: '团队版',
    description: '小团队与重度用户，配额几乎不限',
    price: 49,
    currency: 'CNY',
    features: [
      '专业版全部能力',
      'AI 配额不限（-1）',
      '无限云工作区',
      '100GB 云存储额度（规划）',
      '优先支持（规划）',
    ],
    limits: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 },
  },
]

export function getBillablePlanNames(): string[] {
  return BILLING_PLANS.filter((plan) => plan.name !== 'free').map((plan) => plan.name)
}

export function findPlanByName(name: string): PlanDefinition | undefined {
  return BILLING_PLANS.find((plan) => plan.name === name || plan.id === name)
}

export function getPlanLimits(planName: string): PlanDefinition['limits'] {
  return findPlanByName(planName)?.limits ?? BILLING_PLANS[0].limits
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

/** Plan price in fen (分) for CN payment APIs. */
export function getPlanAmountCents(planName: string): number {
  const plan = findPlanByName(planName)
  if (!plan || plan.price <= 0) return 0
  return Math.round(plan.price * 100)
}

export function formatPlanPrice(plan: PlanDefinition): string {
  if (plan.price === 0) return '免费'
  if (plan.currency === 'CNY') return `¥${plan.price}`
  return `$${plan.price}`
}

/** Build { planName: limits } map for client services. */
export function planLimitsByName(): Record<string, PlanDefinition['limits']> {
  return Object.fromEntries(BILLING_PLANS.map((p) => [p.name, p.limits]))
}
