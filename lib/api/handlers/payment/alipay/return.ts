/**
 * 支付宝浏览器同步回跳 — 验签 + 查单 + 补全订阅（notify 未到时的兜底）
 */
import { jsonResponse } from '../../../http'
import { localizedErrorResponse } from '../../../localizedError'
import { requireAuth } from '../../../requireAuth'
import { isAlipayConfigured } from '../../../../billing/cnPayment'
import { parseAlipayReturnQuery } from '../../../../billing/alipayPay'
import { reconcileAlipayReturn } from '../../../../billing/alipayReconcile'
import { trackServerEvent } from '../../../logger'

export async function POST(request: Request) {
  if (!isAlipayConfigured()) {
    return localizedErrorResponse(request, 'api.checkout.alipayNotConfigured', 503)
  }

  try {
    const auth = await requireAuth(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { returnQuery?: string } & Record<string, string>
    const result = await reconcileAlipayReturn(auth.user.id, body)
    const parsed = body.returnQuery?.trim()
      ? parseAlipayReturnQuery(body.returnQuery)
      : body

    trackServerEvent(request, 'billing.alipay.return', {
      userId: auth.user.id,
      outTradeNo: parsed.out_trade_no,
      fulfilled: result.fulfilled,
      alreadyPaid: result.alreadyPaid,
      tradeStatus: result.tradeStatus,
      plan: result.subscription.plan,
    })

    return jsonResponse({
      ...result,
      messageKey:
        result.subscription.plan !== 'free'
          ? 'api.payment.return.upgraded'
          : result.fulfilled
            ? 'api.payment.return.pending'
            : 'api.payment.return.notPaid',
    })
  } catch (error) {
    console.error('[Alipay return] error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return jsonResponse({ error: detail, errorKey: 'api.payment.return.failed' }, 400)
  }
}
