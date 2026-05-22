/**
 * Cancel subscription — Stripe or dev mock.
 */
import { apiMessage } from '../../../i18n/apiMessages'
import { resolveRequestLocale } from '../../../i18n/resolveLocale'
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
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

    const locale = resolveRequestLocale(request)
    const updated = await getUserSubscription(auth.user.id)
    if (!updated) {
      return jsonResponse({
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        message: immediate
          ? apiMessage('api.subscription.cancelImmediate', locale)
          : apiMessage('api.subscription.cancelScheduled', locale),
      })
    }

    return jsonResponse({
      subscription: {
        plan: updated.plan.name,
        status: updated.status,
        currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      },
      message: immediate
        ? apiMessage('api.subscription.cancelDoneNow', locale)
        : apiMessage('api.subscription.cancelEndOfPeriod', locale),
    })
  } catch (error) {
    console.error('[Subscription cancel] error:', error)
    return localizedErrorResponse(request, 'api.subscription.cancelFailed', 500)
  }
}
