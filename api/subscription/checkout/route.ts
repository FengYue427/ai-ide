// 创建 Stripe Checkout 会话
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
