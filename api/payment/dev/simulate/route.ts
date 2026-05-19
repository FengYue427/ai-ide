/**
 * Dev-only: create a pending order and fulfill it (tests CN payment DB path without real Alipay/WeChat).
 * Never available in production.
 */
import { errorResponse, jsonResponse } from '../../../../lib/api/http'
import { requireAuth } from '../../../../lib/api/requireAuth'
import { isDevPaymentSimulateAllowed } from '../../../../lib/billing/billingMode'
import { fulfillPaymentOrder } from '../../../../lib/billing/fulfillOrder'
import { createPaymentOrder } from '../../../../lib/billing/paymentOrders'
import { findPlanByName, getBillablePlanNames, getPlanAmountCents } from '../../../../lib/billing/plans'

export async function POST(request: Request) {
  if (!isDevPaymentSimulateAllowed()) {
    return errorResponse('仅开发环境可用', 403)
  }

  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { planId?: string; channel?: 'alipay' | 'wechat' }
    const planId = body.planId?.trim() || 'pro'
    const channel = body.channel === 'wechat' ? 'wechat' : 'alipay'

    if (!getBillablePlanNames().includes(planId)) {
      return errorResponse('无效的计划', 400)
    }

    const plan = findPlanByName(planId)
    if (!plan) return errorResponse('无效的计划', 400)

    const amountCents = getPlanAmountCents(planId)
    if (amountCents <= 0) return errorResponse('该计划无需支付', 400)

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
    return errorResponse(error instanceof Error ? error.message : '模拟支付失败', 500)
  }
}
