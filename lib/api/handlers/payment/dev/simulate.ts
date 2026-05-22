/**
 * Dev-only: create a pending order and fulfill it (tests CN payment DB path without real Alipay/WeChat).
 * Never available in production.
 */
import { jsonResponse } from '../../../http'
import { localizedErrorResponse } from '../../../localizedError'
import { requireAuth } from '../../../requireAuth'
import { isDevPaymentSimulateAllowed } from '../../../../billing/billingMode'
import { fulfillPaymentOrder } from '../../../../billing/fulfillOrder'
import { createPaymentOrder } from '../../../../billing/paymentOrders'
import { findPlanByName, getBillablePlanNames, getPlanAmountCents } from '../../../../billing/plans'

export async function POST(request: Request) {
  if (!isDevPaymentSimulateAllowed()) {
    return localizedErrorResponse(request, 'api.payment.devOnly', 403)
  }

  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { planId?: string; channel?: 'alipay' | 'wechat' }
    const planId = body.planId?.trim() || 'pro'
    const channel = body.channel === 'wechat' ? 'wechat' : 'alipay'

    if (!getBillablePlanNames().includes(planId)) {
      return localizedErrorResponse(request, 'api.checkout.invalidPlan', 400)
    }

    const plan = findPlanByName(planId)
    if (!plan) return localizedErrorResponse(request, 'api.checkout.invalidPlan', 400)

    const amountCents = getPlanAmountCents(planId)
    if (amountCents <= 0) return localizedErrorResponse(request, 'api.checkout.noPaymentNeeded', 400)

    const order = await createPaymentOrder({
      userId: auth.user.id,
      planName: plan.name,
      channel,
      amountCents,
    })

    const { subscription, alreadyPaid } = await fulfillPaymentOrder(order.outTradeNo, 'dev-simulate')

    return jsonResponse({
      ok: true,
      simulated: true,
      alreadyPaid,
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      plan: subscription.plan.name,
      subscription: {
        plan: subscription.plan.name,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    })
  } catch (error) {
    console.error('[Payment dev simulate] error:', error)
    return localizedErrorResponse(request, 'api.payment.simulateFailed', 500)
  }
}
