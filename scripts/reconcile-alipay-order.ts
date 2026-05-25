/**
 * Reconcile a paid order by out_trade_no (when notify/return missed).
 * Usage: npm run billing:reconcile -- aide_xxx
 */
import { loadEnvLocal } from './load-env-local.mjs'
import { prisma } from '../lib/billing/prismaUpsert'
import { queryAlipayTrade } from '../lib/billing/alipayPay'
import { queryWechatTrade } from '../lib/billing/wechatPay'
import { fulfillPaymentOrder } from '../lib/billing/fulfillOrder'
import { getPaymentOrderByOutTradeNo } from '../lib/billing/paymentOrders'

loadEnvLocal()

const outTradeNo = process.argv[2]?.trim()
if (!outTradeNo) {
  console.error('用法: npm run billing:reconcile -- <out_trade_no>')
  console.error('示例: npm run billing:reconcile -- aide_1779700468441_4b9aea50')
  process.exit(1)
}

async function main() {
  const order = await getPaymentOrderByOutTradeNo(outTradeNo)
  if (!order) {
    console.error('❌ 订单不存在:', outTradeNo)
    process.exit(1)
  }

  console.log('订单:', order.outTradeNo, order.status, order.channel, order.planName, order.userId)

  if (order.status === 'paid') {
    console.log('✅ 订单已是 paid，无需补单')
    return
  }

  let tradeNo: string | undefined
  if (order.channel === 'wechat') {
    const { tradeState, transactionId } = await queryWechatTrade(outTradeNo)
    console.log('微信查单:', tradeState, transactionId || '')
    if (tradeState !== 'SUCCESS') {
      console.error('❌ 微信侧未付款成功，当前状态:', tradeState || '(空)')
      process.exit(1)
    }
    tradeNo = transactionId
  } else {
    const { tradeStatus, tradeNo: alipayTradeNo } = await queryAlipayTrade(outTradeNo)
    console.log('支付宝查单:', tradeStatus, alipayTradeNo || '')
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      console.error('❌ 支付宝侧未付款成功，当前状态:', tradeStatus || '(空)')
      process.exit(1)
    }
    tradeNo = alipayTradeNo
  }

  const result = await fulfillPaymentOrder(outTradeNo, tradeNo)
  console.log('✅ 补单完成 plan=', result.subscription.plan.name, 'alreadyPaid=', result.alreadyPaid)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
