/**
 * 订阅 Checkout API - 演示/占位实现
 * 
 * 当前为纯前端模式：
 * - 不创建真实 Stripe 会话
 * - 返回占位链接（前端已禁用订阅 UI）
 * 
 * 如需完整支付流程，需接入 Stripe + Webhook + 数据库
 */
export async function POST(request: Request) {
  try {
    const { planId } = await request.json()

    // 模拟不同计划的 Stripe 价格 ID
    const priceIds: Record<string, string> = {
      pro: 'price_pro_monthly',
      enterprise: 'price_enterprise_monthly'
    }

    const priceId = priceIds[planId]
    if (!priceId) {
      return new Response(JSON.stringify({ error: '无效的计划' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 简化版本：返回前端支付页链接
    const checkoutUrl = `/subscription/checkout?plan=${planId}`
    
    return new Response(JSON.stringify({ url: checkoutUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(JSON.stringify({ error: '创建支付会话失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
