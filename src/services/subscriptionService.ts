import { planLimitsByName } from '../../lib/billing/plans'
import {
  getClientEntitlements,
  getClientEffectivePlanName,
  isClientEntitlementEnabled,
} from '../lib/clientPlanEntitlements'
import type { EntitlementFeature } from '../../lib/billing/entitlements'
import { readJsonResponse, apiFetch } from './apiUtils'

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

export type SubscriptionFetchResult = {
  subscription: Subscription
  notice?: 'expired'
  message?: string
}

export interface UsageStatus {
  aiRequestsToday: number
  aiRequestsLimit: number
  storageUsedGB: number
  storageLimitGB: number
  workspacesUsed: number
  workspacesLimit: number
}

const defaultLimits = planLimitsByName()

class SubscriptionService {
  private currentPlan: string = 'free'
  private listeners: ((plan: string) => void)[] = []

  /**
   * After Stripe redirect, webhook may lag — poll until plan matches or attempts exhausted.
   */
  async refreshAfterCheckout(expectedPlan?: string | null): Promise<Subscription> {
    const delaysMs = [400, 800, 1200, 1600, 2000, 2500]
    let last = await this.getSubscription()

    for (const delay of delaysMs) {
      if (expectedPlan) {
        if (last.subscription.plan === expectedPlan) return last.subscription
      } else if (last.subscription.plan !== 'free') {
        return last.subscription
      }
      await new Promise((resolve) => window.setTimeout(resolve, delay))
      last = await this.getSubscription()
    }

    return last.subscription
  }

  // 获取订阅状态
  async getSubscription(): Promise<SubscriptionFetchResult> {
    const fallback: Subscription = {
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }
    try {
      const res = await apiFetch('/api/subscription', { credentials: 'include' })
      if (res.ok) {
        const data = await readJsonResponse<{
          subscription?: Subscription
          notice?: 'expired'
          message?: string
        }>(res)
        if (data?.subscription) {
          this.currentPlan = data.subscription.plan
          return {
            subscription: data.subscription,
            notice: data.notice,
            message: data.message,
          }
        }
      }
    } catch {
      // 降级到本地默认
    }
    return { subscription: fallback }
  }

  // 获取当前计划
  getCurrentPlan(): string {
    return this.currentPlan
  }

  getEffectivePlanName(): string {
    return getClientEffectivePlanName(this.currentPlan)
  }

  getEntitlements() {
    return getClientEntitlements(this.currentPlan)
  }

  canUseFeature(feature: EntitlementFeature): boolean {
    return isClientEntitlementEnabled(this.currentPlan, feature)
  }

  // 获取使用量限制
  getLimits(): { aiRequestsPerDay: number; workspaces: number; storageGB: number } {
    const effective = getClientEffectivePlanName(this.currentPlan)
    return defaultLimits[effective] || defaultLimits.free
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
  async checkAIQuota(isLoggedIn = false): Promise<{ allowed: boolean; remaining: number }> {
    const { fetchAIQuota } = await import('./usageService')
    const quota = await fetchAIQuota(this.getEffectivePlanName(), isLoggedIn)
    return {
      allowed: quota.allowed,
      remaining: Number.isFinite(quota.remaining) ? quota.remaining : Infinity,
    }
  }
}

export const subscriptionService = new SubscriptionService()
