import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { optionalAuth, requireAuth } from '../../requireAuth'
import { consumeAutopilotRun, getAutopilotQuotaForUser } from '../../../billing/autopilotUsage'

export async function GET(req: Request) {
  try {
    const user = await optionalAuth(req)
    if (!user) {
      return jsonResponse({ source: 'anonymous', quota: null })
    }

    const quota = await getAutopilotQuotaForUser(user.id)
    return jsonResponse({ source: 'server', quota })
  } catch (error) {
    console.error('[Usage Autopilot GET] error:', error)
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

    const result = await consumeAutopilotRun(auth.user.id)
    if (!result.ok) {
      return jsonResponse(
        {
          errorKey: 'api.autopilot.dailyLimitUpgrade',
          source: 'server',
          quota: result.quota,
        },
        429,
      )
    }

    return jsonResponse({ source: 'server', quota: result.quota })
  } catch (error) {
    console.error('[Usage Autopilot POST] error:', error)
    return localizedErrorResponse(req, 'api.usage.writeFailed', 500)
  }
}
