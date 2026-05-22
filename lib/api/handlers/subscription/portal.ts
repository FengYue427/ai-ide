/**
 * Stripe Customer Portal — manage payment method / subscription.
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import { getUserSubscription } from '../../../billing/subscriptionDb'
import { createStripeBillingPortalSession, isStripeConfigured } from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    if (!isStripeConfigured()) {
      return localizedErrorResponse(request, 'api.subscription.portalNotConfigured', 503)
    }

    const record = await getUserSubscription(auth.user.id)
    if (!record?.stripeCustomerId) {
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
