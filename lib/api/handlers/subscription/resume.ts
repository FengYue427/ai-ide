/**
 * Resume subscription — undo cancel_at_period_end (Stripe or dev).
 */
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import {
  clearSubscriptionCancelFlag,
  getUserSubscription,
} from '../../../billing/subscriptionDb'
import { isStripeConfigured, resumeStripeSubscription } from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const record = await getUserSubscription(auth.user.id)
    if (!record || record.plan.name === 'free') {
      return localizedErrorResponse(request, 'api.subscription.noResume', 400)
    }

    if (!record.cancelAtPeriodEnd) {
      return jsonResponse(
        appendApiMessage(request, 'api.subscription.resumeActive', {
          subscription: {
            plan: record.plan.name,
            status: record.status,
            currentPeriodEnd: record.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: false,
          },
        }),
      )
    }

    if (record.stripeSubscriptionId && isStripeConfigured()) {
      await resumeStripeSubscription(record.stripeSubscriptionId)
    }

    const updated = await clearSubscriptionCancelFlag(auth.user.id)

    return jsonResponse(
      appendApiMessage(request, 'api.subscription.resumeOk', {
        subscription: {
          plan: updated.plan.name,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        },
      }),
    )
  } catch (error) {
    console.error('[Subscription resume] error:', error)
    return localizedErrorResponse(request, 'api.subscription.resumeFailed', 500)
  }
}
