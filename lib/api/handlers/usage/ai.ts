/**
 * AI usage quota — server-backed daily counts (authenticated users).
 */
import { jsonResponse, errorResponse } from '../../http'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { optionalAuth, requireAuth } from '../../requireAuth'
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
    return errorResponse('无法读取用量', 500)
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
    if (!rate.allowed) return rateLimitErrorResponse(rate)

    const body = (await req.json().catch(() => ({}))) as { amount?: number }
    const amount = typeof body.amount === 'number' && body.amount > 0 ? Math.floor(body.amount) : 1

    const result = await consumeAiUsage(auth.user.id, amount)
    if (!result.ok) {
      return jsonResponse(
        {
          error: '今日 AI 配额已用完',
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
    return errorResponse('无法记录用量', 500)
  }
}
