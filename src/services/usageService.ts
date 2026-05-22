import { planLimitsByName } from '../../lib/billing/plans'
import { serviceText } from '../lib/serviceI18n'
import type { QuotaCheck } from './aiService'
import { readJsonResponse, apiFetch } from './apiUtils'
import { trackEvent } from '../lib/observability'

const USAGE_KEY = 'ai-usage-today'
const USAGE_DATE_KEY = 'ai-usage-date'
const SERVER_QUOTA_CACHE_KEY = 'ai-quota-server-cache'

interface LocalUsageRecord {
  count: number
  date: string
}

const planLimits: Record<string, number> = Object.fromEntries(
  Object.entries(planLimitsByName()).map(([name, limits]) => [name, limits.aiRequestsPerDay]),
)

export class QuotaExceededError extends Error {
  readonly quota: QuotaCheck

  constructor(quota: QuotaCheck) {
    super(serviceText('usage.quota.exceeded', { used: quota.used, limit: quota.limit }))
    this.name = 'QuotaExceededError'
    this.quota = quota
  }
}

export class QuotaSyncError extends Error {
  constructor(message = serviceText('usage.quota.syncFailed')) {
    super(message)
    this.name = 'QuotaSyncError'
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getStoredUsage(): LocalUsageRecord {
  const stored = localStorage.getItem(USAGE_KEY)
  const storedDate = localStorage.getItem(USAGE_DATE_KEY)
  const today = getToday()

  if (stored && storedDate === today) {
    return JSON.parse(stored) as LocalUsageRecord
  }

  const fresh: LocalUsageRecord = { count: 0, date: today }
  localStorage.setItem(USAGE_KEY, JSON.stringify(fresh))
  localStorage.setItem(USAGE_DATE_KEY, today)
  return fresh
}

export function checkAIQuotaLocal(currentPlan: string = 'free'): QuotaCheck {
  const usage = getStoredUsage()
  const limit = planLimits[currentPlan] ?? planLimits.free

  if (limit === -1) {
    return { allowed: true, used: usage.count, limit, remaining: Infinity, plan: currentPlan }
  }

  return {
    allowed: usage.count < limit,
    used: usage.count,
    limit,
    remaining: Math.max(0, limit - usage.count),
    plan: currentPlan,
  }
}

function incrementLocalUsage(currentPlan: string, amount = 1): void {
  const usage = getStoredUsage()
  const limit = planLimits[currentPlan] ?? planLimits.free
  if (limit !== -1 && usage.count + amount > limit) {
    return
  }
  usage.count += amount
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

function cacheServerQuota(quota: QuotaCheck): void {
  try {
    sessionStorage.setItem(
      SERVER_QUOTA_CACHE_KEY,
      JSON.stringify({ quota, date: getToday(), at: Date.now() }),
    )
  } catch {
    // ignore quota cache failures
  }
}

function readCachedServerQuota(currentPlan: string): QuotaCheck | null {
  try {
    const raw = sessionStorage.getItem(SERVER_QUOTA_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { quota?: QuotaCheck; date?: string }
    if (parsed.date !== getToday() || !parsed.quota) return null
    return { ...parsed.quota, plan: parsed.quota.plan || currentPlan }
  } catch {
    return null
  }
}

export async function fetchAIQuota(currentPlan: string, isLoggedIn: boolean): Promise<QuotaCheck> {
  if (!isLoggedIn) {
    return checkAIQuotaLocal(currentPlan)
  }

  try {
    const response = await apiFetch('/api/usage/ai', { credentials: 'include' })
    const data = await readJsonResponse<{ source?: string; quota?: QuotaCheck }>(response)
    if (response.ok && data?.quota) {
      cacheServerQuota(data.quota)
      return data.quota
    }
  } catch {
    // use cache or fail-closed below
  }

  const cached = readCachedServerQuota(currentPlan)
  if (cached) return cached

  const limit = planLimits[currentPlan] ?? planLimits.free
  if (limit === -1) {
    return { allowed: true, used: 0, limit, remaining: Infinity, plan: currentPlan }
  }

  return {
    allowed: false,
    used: limit,
    limit,
    remaining: 0,
    plan: currentPlan,
  }
}

export async function ensureAIQuotaAllowed(
  currentPlan: string,
  isLoggedIn: boolean,
): Promise<QuotaCheck> {
  const quota = await fetchAIQuota(currentPlan, isLoggedIn)
  if (!quota.allowed) {
    throw new QuotaExceededError(quota)
  }
  return quota
}

/** Resolve plan + login from ideStore without a static import cycle. */
export async function ensureAIQuotaFromStore(): Promise<QuotaCheck> {
  const { useIDEStore } = await import('../store/ideStore')
  const state = useIDEStore.getState()
  return ensureAIQuotaAllowed(state.currentPlan, !!state.currentUser)
}

export async function recordAIUsageEvent(
  isLoggedIn: boolean,
  currentPlan = 'free',
): Promise<void> {
  if (!isLoggedIn) {
    incrementLocalUsage(currentPlan)
    return
  }

  try {
    const response = await apiFetch('/api/usage/ai', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (response.status === 429) {
      const data = await readJsonResponse<{ quota?: QuotaCheck }>(response)
      trackEvent('usage.ai.quota_exceeded', { quota: data?.quota })
      if (data?.quota) {
        throw new QuotaExceededError(data.quota)
      }
      throw new QuotaExceededError(await fetchAIQuota(currentPlan, true))
    }
    if (!response.ok) {
      throw new QuotaSyncError()
    }
    const data = await readJsonResponse<{ quota?: QuotaCheck }>(response)
    if (data?.quota) {
      cacheServerQuota(data.quota)
    }
  } catch (error) {
    if (error instanceof QuotaExceededError || error instanceof QuotaSyncError) throw error
    throw new QuotaSyncError()
  }
}
