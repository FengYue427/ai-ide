import { getClientEntitlements } from './clientPlanEntitlements'

const STORAGE_PREFIX = 'aide.autopilot.runs.'

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function storageKey(): string {
  return `${STORAGE_PREFIX}${utcDayKey()}`
}

export function getLocalAutopilotRunsToday(): number {
  try {
    const raw = localStorage.getItem(storageKey())
    const n = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function incrementLocalAutopilotRun(): number {
  const next = getLocalAutopilotRunsToday() + 1
  try {
    localStorage.setItem(storageKey(), String(next))
  } catch {
    // ignore
  }
  return next
}

export function getLocalAutopilotQuota(planName: string): {
  allowed: boolean
  used: number
  limit: number
  remaining: number
  unlimited: boolean
} {
  const limit = getClientEntitlements(planName).autopilotRunsPerDay
  const used = getLocalAutopilotRunsToday()
  if (limit < 0) {
    return {
      allowed: true,
      used,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      unlimited: true,
    }
  }
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    unlimited: false,
  }
}

export function consumeLocalAutopilotRun(planName: string): { ok: boolean; remaining: number } {
  const quota = getLocalAutopilotQuota(planName)
  if (!quota.allowed) {
    return { ok: false, remaining: 0 }
  }
  const used = incrementLocalAutopilotRun()
  if (quota.unlimited) {
    return { ok: true, remaining: Number.POSITIVE_INFINITY }
  }
  return { ok: true, remaining: Math.max(0, quota.limit - used) }
}
