/**
 * Subscription checkout — 支付宝 / 微信（优先），Stripe（海外主路径），开发 mock 兜底
 */
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { requireAuth } from '../../requireAuth'
import { isDevBillingAllowed } from '../../../billing/billingMode'
import { isPublicWelfareMode } from '../../../billing/publicWelfare'
import { createCnCheckout, isAlipayConfigured, isCnPaymentConfigured, isWechatPayConfigured } from '../../../billing/cnPayment'
import type { PaymentChannel } from '../../../billing/paymentOrders'
import { findPlanByName, getBillablePlanNames, getPlanAmountCents } from '../../../billing/plans'
import { getUserSubscription, upsertUserSubscription } from '../../../billing/subscriptionDb'
import { createStripeCheckoutSession, isStripeConfigured } from '../../../billing/stripe'
import { trackServerEvent } from '../../logger'

export async function POST(request: Request) {
  try {
    if (isPublicWelfareMode()) {
      return localizedErrorResponse(request, 'api.checkout.publicWelfare', 403)
    }

    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { planId?: string; channel?: PaymentChannel }
    const planId = body.planId?.trim()
    const channel = body.channel

    if (!planId) {
      return localizedErrorResponse(request, 'api.checkout.missingPlanId', 400)
    }

    if (planId === 'free') {
      return localizedErrorResponse(request, 'api.checkout.freeNoCheckout', 400)
    }

    if (!getBillablePlanNames().includes(planId)) {
      return localizedErrorResponse(request, 'api.checkout.invalidPlan', 400)
    }

    const plan = findPlanByName(planId)
    if (!plan) {
      return localizedErrorResponse(request, 'api.checkout.invalidPlan', 400)
    }

    if (channel === 'alipay' || channel === 'wechat') {
      if (channel === 'alipay' && !isAlipayConfigured()) {
        return localizedErrorResponse(request, 'api.checkout.alipayNotConfigured', 503)
      }
      if (channel === 'wechat' && !isWechatPayConfigured()) {
        return localizedErrorResponse(request, 'api.checkout.wechatNotConfigured', 503)
      }

      const amountCents = getPlanAmountCents(plan.name)
      if (amountCents <= 0) {
        return localizedErrorResponse(request, 'api.checkout.noPaymentNeeded', 400)
      }

      const result = await createCnCheckout({
        req: request,
        userId: auth.user.id,
        planName: plan.name,
        channel,
      })
      trackServerEvent(request, 'billing.checkout.created', {
        userId: auth.user.id,
        plan: plan.name,
        channel,
        mode: 'cn',
      })
      return jsonResponse(result)
    }

    if (isCnPaymentConfigured()) {
      return localizedErrorResponse(request, 'api.checkout.channelRequired', 400)
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
      trackServerEvent(request, 'billing.checkout.created', {
        userId: auth.user.id,
        plan: plan.name,
        channel: 'stripe',
        mode: 'stripe',
      })
      return jsonResponse({ mode: 'stripe', url })
    }

    if (!isDevBillingAllowed()) {
      return localizedErrorResponse(request, 'api.checkout.notConfigured', 503)
    }

    const record = await upsertUserSubscription(auth.user.id, plan.name)
    return jsonResponse(
      appendApiMessage(
        request,
        'api.checkout.devUpgraded',
        {
          mode: 'dev_mock',
          plan: record.plan.name,
          subscription: {
            plan: record.plan.name,
            status: record.status,
            currentPeriodEnd: record.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: record.cancelAtPeriodEnd,
          },
        },
        { plan: record.plan.displayName },
      ),
    )
  } catch (error) {
    console.error('[Checkout] error:', error)
    return localizedErrorResponse(request, 'api.checkout.sessionFailed', 500)
  }
}
