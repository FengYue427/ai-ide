/**
 * 支付宝异步通知 — 验签后升级订阅
 */
import { fulfillPaymentOrder } from '../../../../lib/billing/fulfillOrder'
import { verifyAlipayNotify } from '../../../../lib/billing/alipayPay'
import { isAlipayConfigured } from '../../../../lib/billing/cnPayment'

function parseFormBody(text: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const part of text.split('&')) {
    const [rawKey, rawVal = ''] = part.split('=')
    if (!rawKey) continue
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal.replace(/\+/g, ' '))
  }
  return params
}

export async function POST(request: Request) {
  if (!isAlipayConfigured()) {
    return new Response('fail', { status: 501 })
  }

  try {
    const text = await request.text()
    const params = parseFormBody(text)

    if (!verifyAlipayNotify(params)) {
      console.error('[Alipay notify] invalid signature')
      return new Response('fail', { status: 400 })
    }

    const tradeStatus = params.trade_status
    const outTradeNo = params.out_trade_no
    if (!outTradeNo) return new Response('fail', { status: 400 })

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const result = await fulfillPaymentOrder(outTradeNo, params.trade_no)
      if (result.alreadyPaid) {
        console.log('[Alipay notify] duplicate notify (already paid):', outTradeNo)
      }
    }

    return new Response('success', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  } catch (error) {
    console.error('[Alipay notify] error:', error)
    return new Response('fail', { status: 500 })
  }
}
