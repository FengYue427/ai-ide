/**
 * Cron: downgrade subscriptions past period end + grace.
 * Auth: Authorization: Bearer ${BILLING_CRON_SECRET}
 */
import { isCronAuthorized } from '../../cronAuth'
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { processExpiredSubscriptions } from '../../../billing/subscriptionExpiry'

async function runExpire(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return localizedErrorResponse(request, 'api.auth.unauthorized', 401)
  }

  try {
    const result = await processExpiredSubscriptions()
    return jsonResponse(
      appendApiMessage(request, 'api.billing.expireCronOk', {
        success: true,
        ...result,
      }),
    )
  } catch (error) {
    console.error('[Billing expire cron] error:', error)
    return localizedErrorResponse(request, 'api.subscription.cancelFailed', 500)
  }
}

/** Vercel Cron invokes GET; manual ops may use POST. */
export async function GET(request: Request) {
  return runExpire(request)
}

export async function POST(request: Request) {
  return runExpire(request)
}
