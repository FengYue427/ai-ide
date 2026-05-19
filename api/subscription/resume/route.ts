/**
 * Resume subscription — undo cancel_at_period_end (Stripe or dev).
 */
import { jsonResponse, errorResponse } from '../../../lib/api/http'
import { requireAuth } from '../../../lib/api/requireAuth'
import {
  clearSubscriptionCancelFlag,
  getUserSubscription,
} from '../../../lib/billing/subscriptionDb'
import { isStripeConfigured, resumeStripeSubscription } from '../../../lib/billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const record = await getUserSubscription(auth.user.id)
    if (!record || record.plan.name === 'free') {
      return errorResponse('当前没有可恢复的付费订阅', 400)
    }

    if (!record.cancelAtPeriodEnd) {
      return jsonResponse({
        subscription: {
          plan: record.plan.name,
          status: record.status,
          currentPeriodEnd: record.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: false,
        },
        message: '订阅仍在生效中，无需恢复',
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
      message: '已恢复订阅，下个周期将正常续费',
    })
  } catch (error) {
    console.error('[Subscription resume] error:', error)
    return errorResponse(error instanceof Error ? error.message : '恢复订阅失败', 500)
  }
}
