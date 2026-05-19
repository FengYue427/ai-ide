/**
 * 查询支付订单状态（微信扫码轮询）
 */
import { errorResponse, jsonResponse } from '../../../../lib/api/http'
import { requireAuth } from '../../../../lib/api/requireAuth'
import { getPaymentOrderById } from '../../../../lib/billing/paymentOrders'

export async function GET(
  request: Request,
  ctx?: { params: Record<string, string> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return errorResponse('缺少订单 ID', 400)

  const order = await getPaymentOrderById(id)
  if (!order || order.userId !== auth.user.id) {
    return errorResponse('订单不存在', 404)
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
