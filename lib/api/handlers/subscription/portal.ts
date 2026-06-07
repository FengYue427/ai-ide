/**
 * Billing portal — Paddle Customer Portal or Stripe Customer Portal.
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import { getUserSubscription } from '../../../billing/subscriptionDb'
import { createPaddleCustomerPortalSession, isPaddleConfigured } from '../../../billing/paddle'
import { createStripeBillingPortalSession, isStripeConfigured } from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const record = await getUserSubscription(auth.user.id)
    if (!record) {
      return localizedErrorResponse(request, 'api.subscription.noStripeCustomer', 400)
    }

    if (record.paddleCustomerId && isPaddleConfigured()) {
      const url = await createPaddleCustomerPortalSession({
        req: request,
        customerId: record.paddleCustomerId,
        subscriptionId: record.paddleSubscriptionId,
      })
      return jsonResponse({ mode: 'paddle', url })
    }

    if (!isStripeConfigured()) {
      return localizedErrorResponse(request, 'api.subscription.portalNotConfigured', 503)
    }

    if (!record.stripeCustomerId) {
      return localizedErrorResponse(request, 'api.subscription.noStripeCustomer', 400)
    }

    const url = await createStripeBillingPortalSession({
      req: request,
      customerId: record.stripeCustomerId,
    })

    return jsonResponse({ mode: 'stripe', url })
  } catch (error) {
    console.error('[Subscription portal] error:', error)
    return localizedErrorResponse(request, 'api.subscription.portalFailed', 500)
  }
}
