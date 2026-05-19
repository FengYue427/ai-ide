/**
 * Stripe Customer Portal — manage payment method / subscription.
 */
import { errorResponse, jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { getUserSubscription } from '../../../billing/subscriptionDb'
import { createStripeBillingPortalSession, isStripeConfigured } from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    if (!isStripeConfigured()) {
      return errorResponse('当前环境未配置 Stripe 客户门户', 503)
    }

    const record = await getUserSubscription(auth.user.id)
    if (!record?.stripeCustomerId) {
      return errorResponse('未找到 Stripe 客户记录，请先完成一次付费订阅', 400)
    }

    const url = await createStripeBillingPortalSession({
      req: request,
      customerId: record.stripeCustomerId,
    })

    return jsonResponse({ mode: 'stripe', url })
  } catch (error) {
    console.error('[Subscription portal] error:', error)
    return errorResponse(error instanceof Error ? error.message : '无法打开客户门户', 500)
  }
}
