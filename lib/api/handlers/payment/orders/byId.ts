/**
 * 查询支付订单状态（微信扫码轮询）
 */
import { jsonResponse } from '../../../http'
import { localizedErrorResponse } from '../../../localizedError'
import { requireAuth } from '../../../requireAuth'
import { getPaymentOrderById } from '../../../../billing/paymentOrders'

export async function GET(
  request: Request,
  ctx?: { params: Record<string, string> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(request, 'api.payment.orderIdRequired', 400)

  const order = await getPaymentOrderById(id)
  if (!order || order.userId !== auth.user.id) {
    return localizedErrorResponse(request, 'api.payment.orderNotFound', 404)
  }

  return jsonResponse({
    order: {
      id: order.id,
      status: order.status,
      planName: order.planName,
      channel: order.channel,
      outTradeNo: order.outTradeNo,
      paidAt: order.paidAt?.toISOString() ?? null,
    },
  })
}
