export interface Plan {
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

export interface Subscription {
  plan: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface UsageStatus {
  aiRequestsToday: number
  aiRequestsLimit: number
  storageUsedGB: number
  storageLimitGB: number
  workspacesUsed: number
  workspacesLimit: number
}

const defaultLimits: Record<string, { aiRequestsPerDay: number; workspaces: number; storageGB: number }> = {
  free: { aiRequestsPerDay: 50, workspaces: 3, storageGB: 1 },
  pro: { aiRequestsPerDay: 500, workspaces: -1, storageGB: 10 },
  enterprise: { aiRequestsPerDay: -1, workspaces: -1, storageGB: 100 }
}

class SubscriptionService {
  private currentPlan: string = 'free'
  private listeners: ((plan: string) => void)[] = []

  // 获取订阅状态
  async getSubscription(): Promise<Subscription> {
    try {
      const res = await fetch('/api/subscription')
      if (res.ok) {
        const data = await res.json()
        if (data.subscription) {
          this.currentPlan = data.subscription.plan
          return data.subscription
        }
      }
    } catch {
      // 降级到本地默认
    }
    return {
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    }
  }

  // 获取当前计划
  getCurrentPlan(): string {
    return this.currentPlan
  }

  // 检查功能是否可用
  canUseFeature(feature: keyof typeof defaultLimits.free): boolean {
    // 简化版本：Pro 及以上全部可用
    if (this.currentPlan === 'enterprise') return true
    if (this.currentPlan === 'pro') return true
    // free 计划有具体限制
    return false
  }

  // 获取使用量限制
  getLimits(): { aiRequestsPerDay: number; workspaces: number; storageGB: number } {
    return defaultLimits[this.currentPlan] || defaultLimits.free
  }

  // 订阅计划变更
  subscribeToPlan(planId: string): void {
    this.currentPlan = planId
    this.listeners.forEach(cb => cb(planId))
  }

  // 监听计划变更
  onPlanChange(callback: (plan: string) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  // 检查是否超过 AI 用量限制
  async checkAIQuota(): Promise<{ allowed: boolean; remaining: number }> {
    const limits = this.getLimits()
    if (limits.aiRequestsPerDay === -1) {
      return { allowed: true, remaining: Infinity }
    }
    
    // 这里应该查询实际使用量
    // 简化版本：假设已用 0
    const used = 0
    return {
      allowed: used < limits.aiRequestsPerDay,
      remaining: limits.aiRequestsPerDay - used
    }
  }
}

export const subscriptionService = new SubscriptionService()
