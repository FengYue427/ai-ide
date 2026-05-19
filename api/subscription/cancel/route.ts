/**
 * Cancel subscription — Stripe or dev mock.
 */
import { jsonResponse, errorResponse } from '../../../lib/api/http'
import { requireAuth } from '../../../lib/api/requireAuth'
import {
  downgradeUserToFree,
  getUserSubscription,
  scheduleSubscriptionCancel,
} from '../../../lib/billing/subscriptionDb'
import {
  cancelStripeSubscriptionAtPeriodEnd,
  cancelStripeSubscriptionImmediately,
  isStripeConfigured,
} from '../../../lib/billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json().catch(() => ({}))) as { immediate?: boolean }
    const immediate = Boolean(body.immediate)

    const record = await getUserSubscription(auth.user.id)
    if (!record || record.plan.name === 'free') {
      return errorResponse('当前为免费计划，无需取消', 400)
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
      return jsonResponse({
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
        message: immediate ? '已降级为免费版' : '订阅已取消',
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
        ? '已立即降级为免费版'
        : '已安排在周期结束后降级，到期前仍可使用当前计划',
    })
  } catch (error) {
    console.error('[Subscription cancel] error:', error)
    return errorResponse(error instanceof Error ? error.message : '取消订阅失败', 500)
  }
}
