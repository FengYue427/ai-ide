/**
 * AI usage quota — server-backed daily counts (authenticated users).
 */
import { apiMessage } from '../../../i18n/apiMessages'
import { resolveRequestLocale } from '../../../i18n/resolveLocale'
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { optionalAuth, requireAuth } from '../../requireAuth'
import { trackServerEvent } from '../../logger'
import {
  buildQuotaSnapshot,
  consumeAiUsage,
  getAiUsageCountToday,
  resolveUserPlanName,
} from '../../../billing/usageDb'

export async function GET(req: Request) {
  try {
    const user = await optionalAuth(req)
    if (!user) {
      return jsonResponse({ source: 'anonymous', quota: null })
    }

    const plan = await resolveUserPlanName(user.id)
    const used = await getAiUsageCountToday(user.id)
    return jsonResponse({
      source: 'server',
      quota: buildQuotaSnapshot(plan, used),
    })
  } catch (error) {
    console.error('[Usage AI GET] error:', error)
    return localizedErrorResponse(req, 'api.usage.readFailed', 500)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('usage:ai'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    // Server-authoritative: one successful AI request consumes exactly one unit.
    void (await req.json().catch(() => ({})))
    const amount = 1

    const result = await consumeAiUsage(auth.user.id, amount)
    if (!result.ok) {
      trackServerEvent(req, 'usage.ai.quota_exceeded', {
        userId: auth.user.id,
        plan: result.quota.plan,
        used: result.quota.used,
        limit: result.quota.limit,
      })
      const locale = resolveRequestLocale(req)
      return jsonResponse(
        {
          error: apiMessage('api.usage.quotaExceeded', locale),
          errorKey: 'api.usage.quotaExceeded',
          source: 'server',
          quota: result.quota,
        },
        429,
      )
    }

    return jsonResponse({
      source: 'server',
      quota: result.quota,
    })
  } catch (error) {
    console.error('[Usage AI POST] error:', error)
    return localizedErrorResponse(req, 'api.usage.writeFailed', 500)
  }
}
