/**
 * Cron: downgrade subscriptions past period end + grace.
 * Auth: Authorization: Bearer ${BILLING_CRON_SECRET}
 */
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { processExpiredSubscriptions } from '../../../billing/subscriptionExpiry'

function cronAuthorized(request: Request): boolean {
  const secret =
    process.env.CRON_SECRET?.trim() || process.env.BILLING_CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return token.length > 0 && token === secret
}

async function runExpire(request: Request): Promise<Response> {
  if (!cronAuthorized(request)) {
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
