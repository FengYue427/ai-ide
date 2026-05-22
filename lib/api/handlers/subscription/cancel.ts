/**
 * Cancel subscription — Stripe or dev mock.
 */
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import {
  downgradeUserToFree,
  getUserSubscription,
  scheduleSubscriptionCancel,
} from '../../../billing/subscriptionDb'
import {
  cancelStripeSubscriptionAtPeriodEnd,
  cancelStripeSubscriptionImmediately,
  isStripeConfigured,
} from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json().catch(() => ({}))) as { immediate?: boolean }
    const immediate = Boolean(body.immediate)

    const record = await getUserSubscription(auth.user.id)
    if (!record || record.plan.name === 'free') {
      return localizedErrorResponse(request, 'api.subscription.freeNoCancel', 400)
    }

    if (record.stripeSubscriptionId && isStripeConfigured()) {
      if (immediate) {
        await cancelStripeSubscriptionImmediately(record.stripeSubscriptionId)
        await downgradeUserToFree(auth.user.id)
      } else {
        await cancelStripeSubscriptionAtPeriodEnd(record.stripeSubscriptionId)
        await scheduleSubscriptionCancel(auth.user.id)
      }
    } else if (immediate) {
      await downgradeUserToFree(auth.user.id)
    } else {
      await scheduleSubscriptionCancel(auth.user.id)
    }

    const updated = await getUserSubscription(auth.user.id)
    if (!updated) {
      const key = immediate ? 'api.subscription.cancelImmediate' : 'api.subscription.cancelScheduled'
      return jsonResponse(
        appendApiMessage(request, key, {
          subscription: {
            plan: 'free',
            status: 'active',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        }),
      )
    }

    const key = immediate ? 'api.subscription.cancelDoneNow' : 'api.subscription.cancelEndOfPeriod'
    return jsonResponse(
      appendApiMessage(request, key, {
        subscription: {
          plan: updated.plan.name,
          status: updated.status,
          currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        },
      }),
    )
  } catch (error) {
    console.error('[Subscription cancel] error:', error)
    return localizedErrorResponse(request, 'api.subscription.cancelFailed', 500)
  }
}
