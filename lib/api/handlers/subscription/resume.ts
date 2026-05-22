/**
 * Resume subscription — undo cancel_at_period_end (Stripe or dev).
 */
import { apiMessage } from '../../../i18n/apiMessages'
import { resolveRequestLocale } from '../../../i18n/resolveLocale'
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
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

    const locale = resolveRequestLocale(request)
    if (!record.cancelAtPeriodEnd) {
      return jsonResponse({
        subscription: {
          plan: record.plan.name,
          status: record.status,
          currentPeriodEnd: record.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: false,
        },
        message: apiMessage('api.subscription.resumeActive', locale),
      })
    }

    if (record.stripeSubscriptionId && isStripeConfigured()) {
      await resumeStripeSubscription(record.stripeSubscriptionId)
    }

    const updated = await clearSubscriptionCancelFlag(auth.user.id)

    return jsonResponse({
      subscription: {
        plan: updated.plan.name,
        status: updated.status,
        currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      },
      message: apiMessage('api.subscription.resumeOk', locale),
    })
  } catch (error) {
    console.error('[Subscription resume] error:', error)
    return localizedErrorResponse(request, 'api.subscription.resumeFailed', 500)
  }
}
