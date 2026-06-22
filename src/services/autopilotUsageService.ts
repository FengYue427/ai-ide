import { apiFetch, readJsonResponse } from './apiUtils'
import {
  consumeLocalAutopilotRun,
  getLocalAutopilotQuota,
} from '../lib/autopilotUsageLocal'
import { getClientEffectivePlanName } from '../lib/clientPlanEntitlements'

export type AutopilotQuota = {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  unlimited: boolean
  source: 'server' | 'local'
}

export async function fetchAutopilotQuota(
  isLoggedIn: boolean,
  planName: string,
): Promise<AutopilotQuota> {
  const effectivePlan = getClientEffectivePlanName(planName)

  if (isLoggedIn) {
    try {
      const res = await apiFetch('/api/usage/autopilot', { credentials: 'include' })
      if (res.ok) {
        const data = await readJsonResponse<{
          quota?: {
            allowed: boolean
            used: number
            limit: number
            remaining: number
            unlimited?: boolean
          }
        }>(res)
        if (data?.quota) {
          return {
            allowed: data.quota.allowed,
            used: data.quota.used,
            limit: data.quota.limit,
            remaining: data.quota.remaining,
            unlimited: Boolean(data.quota.unlimited) || data.quota.limit < 0,
            source: 'server',
          }
        }
      }
    } catch {
      // fall through to local
    }
  }

  const local = getLocalAutopilotQuota(effectivePlan)
  return { ...local, source: 'local' }
}

export async function consumeAutopilotRunClient(
  isLoggedIn: boolean,
  planName: string,
): Promise<{ ok: boolean; remaining: number }> {
  const effectivePlan = getClientEffectivePlanName(planName)

  if (isLoggedIn) {
    try {
      const res = await apiFetch('/api/usage/autopilot', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const data = await readJsonResponse<{
        quota?: { remaining: number; unlimited?: boolean; limit?: number }
        errorKey?: string
      }>(res)
      if (res.ok && data?.quota) {
        const remaining = data.quota.unlimited || (data.quota.limit ?? 0) < 0
          ? Number.POSITIVE_INFINITY
          : data.quota.remaining
        return { ok: true, remaining }
      }
      if (res.status === 429) {
        return { ok: false, remaining: 0 }
      }
    } catch {
      // fall through
    }
  }

  return consumeLocalAutopilotRun(effectivePlan)
}
