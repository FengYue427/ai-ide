import { upsertUserSubscription } from './subscriptionDb'
import { getPaymentOrderByOutTradeNo, markPaymentOrderPaid } from './paymentOrders'

export type FulfillResult = {
  order: { outTradeNo: string; status: string; planName: string; userId: string }
  subscription: Awaited<ReturnType<typeof upsertUserSubscription>>
  alreadyPaid: boolean
}

/**
 * Idempotent payment fulfillment — safe for duplicate Alipay/WeChat notifies.
 */
export async function fulfillPaymentOrder(outTradeNo: string, tradeNo?: string): Promise<FulfillResult> {
  const order = await getPaymentOrderByOutTradeNo(outTradeNo)
  if (!order) {
    throw new Error(`订单不存在: ${outTradeNo}`)
  }

  if (order.status === 'paid') {
    const subscription = await upsertUserSubscription(order.userId, order.planName)
    return {
      order: { outTradeNo: order.outTradeNo, status: 'paid', planName: order.planName, userId: order.userId },
      subscription,
      alreadyPaid: true,
    }
  }

  if (order.status !== 'pending') {
    throw new Error(`订单状态不可支付: ${order.status}`)
  }

  const marked = await markPaymentOrderPaid(outTradeNo, tradeNo)
  if (!marked) {
    const latest = await getPaymentOrderByOutTradeNo(outTradeNo)
    if (latest?.status === 'paid') {
      const subscription = await upsertUserSubscription(latest.userId, latest.planName)
      return {
        order: {
          outTradeNo: latest.outTradeNo,
          status: 'paid',
          planName: latest.planName,
          userId: latest.userId,
        },
        subscription,
        alreadyPaid: true,
      }
    }
    throw new Error(`订单无法标记为已支付: ${outTradeNo}`)
  }

  const subscription = await upsertUserSubscription(order.userId, order.planName)
  return {
    order: { outTradeNo: order.outTradeNo, status: 'paid', planName: order.planName, userId: order.userId },
    subscription,
    alreadyPaid: false,
  }
}
