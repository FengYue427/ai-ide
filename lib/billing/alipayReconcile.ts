import { fulfillPaymentOrder } from './fulfillOrder'
import { getPaymentOrderByOutTradeNo } from './paymentOrders'
import { getUserSubscription } from './subscriptionDb'
import { parseAlipayReturnQuery, queryAlipayTrade, verifyAlipaySign } from './alipayPay'

export type AlipayReconcileResult = {
  fulfilled: boolean
  alreadyPaid: boolean
  tradeStatus: string
  subscription: {
    plan: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  }
}

function formatSubscription(record: Awaited<ReturnType<typeof getUserSubscription>>) {
  if (!record) {
    return {
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }
  }
  return {
    plan: record.plan.name,
    status: record.status,
    currentPeriodEnd: record.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
  }
}

function isPaidTradeStatus(status: string): boolean {
  return status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED'
}

export type AlipayReturnPayload = { returnQuery?: string } & Record<string, string>

function resolveReturnParams(payload: AlipayReturnPayload): Record<string, string> {
  if (payload.returnQuery?.trim()) {
    return parseAlipayReturnQuery(payload.returnQuery.trim())
  }
  const { returnQuery: _rq, ...rest } = payload
  return rest
}

/**
 * Browser sync return after page pay — verifies sign, queries trade, fulfills pending order.
 */
export async function reconcileAlipayReturn(
  userId: string,
  payload: AlipayReturnPayload,
): Promise<AlipayReconcileResult> {
  const returnParams = resolveReturnParams(payload)
  if (!verifyAlipaySign(returnParams)) {
    throw new Error('支付宝回跳验签失败（请用浏览器完整回跳 URL 刷新，勿手写 fetch）')
  }

  const outTradeNo = returnParams.out_trade_no?.trim()
  if (!outTradeNo) {
    throw new Error('缺少 out_trade_no')
  }

  const order = await getPaymentOrderByOutTradeNo(outTradeNo)
  if (!order || order.userId !== userId) {
    throw new Error('订单不存在或无权访问')
  }

  if (order.status === 'paid') {
    const record = await getUserSubscription(userId)
    return {
      fulfilled: false,
      alreadyPaid: true,
      tradeStatus: 'TRADE_SUCCESS',
      subscription: formatSubscription(record),
    }
  }

  const { tradeStatus, tradeNo } = await queryAlipayTrade(outTradeNo)
  if (!isPaidTradeStatus(tradeStatus)) {
    const record = await getUserSubscription(userId)
    return {
      fulfilled: false,
      alreadyPaid: false,
      tradeStatus,
      subscription: formatSubscription(record),
    }
  }

  const result = await fulfillPaymentOrder(outTradeNo, tradeNo ?? returnParams.trade_no)
  return {
    fulfilled: !result.alreadyPaid,
    alreadyPaid: result.alreadyPaid,
    tradeStatus,
    subscription: formatSubscription(result.subscription),
  }
}
