/**
 * Subscription checkout — 支付宝 / 微信（优先），Stripe 可选，开发 mock 兜底
 */
import { jsonResponse, errorResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { isDevBillingAllowed } from '../../../billing/billingMode'
import { createCnCheckout, isAlipayConfigured, isCnPaymentConfigured, isWechatPayConfigured } from '../../../billing/cnPayment'
import type { PaymentChannel } from '../../../billing/paymentOrders'
import { findPlanByName, getBillablePlanNames, getPlanAmountCents } from '../../../billing/plans'
import { getUserSubscription, upsertUserSubscription } from '../../../billing/subscriptionDb'
import { createStripeCheckoutSession, isStripeConfigured } from '../../../billing/stripe'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { planId?: string; channel?: PaymentChannel }
    const planId = body.planId?.trim()
    const channel = body.channel

    if (!planId) {
      return errorResponse('缺少 planId', 400)
    }

    if (planId === 'free') {
      return errorResponse('免费计划无需结账', 400)
    }

    if (!getBillablePlanNames().includes(planId)) {
      return errorResponse('无效的计划', 400)
    }

    const plan = findPlanByName(planId)
    if (!plan) {
      return errorResponse('无效的计划', 400)
    }

    if (channel === 'alipay' || channel === 'wechat') {
      if (channel === 'alipay' && !isAlipayConfigured()) {
        return errorResponse('支付宝未配置，请稍后在服务端配置商户参数', 503)
      }
      if (channel === 'wechat' && !isWechatPayConfigured()) {
        return errorResponse('微信支付未配置，请稍后在服务端配置商户参数', 503)
      }

      const amountCents = getPlanAmountCents(plan.name)
      if (amountCents <= 0) {
        return errorResponse('该计划无需支付', 400)
      }

      const result = await createCnCheckout({
        req: request,
        userId: auth.user.id,
        planName: plan.name,
        channel,
      })
      return jsonResponse(result)
    }

    if (isCnPaymentConfigured()) {
      return errorResponse('请选择支付方式：alipay 或 wechat', 400)
    }

    if (isStripeConfigured()) {
      const existing = await getUserSubscription(auth.user.id)
      const url = await createStripeCheckoutSession({
        req: request,
        userId: auth.user.id,
        email: auth.user.email,
        planName: plan.name,
        stripeCustomerId: existing?.stripeCustomerId,
      })
      return jsonResponse({ mode: 'stripe', url })
    }

    if (!isDevBillingAllowed()) {
      return errorResponse('支付功能尚未配置，请联系管理员', 503)
    }

    const record = await upsertUserSubscription(auth.user.id, plan.name)
    return jsonResponse({
      mode: 'dev_mock',
      plan: record.plan.name,
      message: `开发模式：已升级为 ${record.plan.displayName}`,
      subscription: {
        plan: record.plan.name,
        status: record.status,
        currentPeriodEnd: record.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      },
    })
  } catch (error) {
    console.error('[Checkout] error:', error)
    const message = error instanceof Error ? error.message : '创建支付会话失败'
    return errorResponse(message, 500)
  }
}
