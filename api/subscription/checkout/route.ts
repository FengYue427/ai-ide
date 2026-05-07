import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 创建 Stripe Checkout 会话
export async function POST(request: Request) {
  try {
    const { planId } = await request.json()

    // 简化版本：返回模拟的支付链接
    // 实际生产环境应调用 Stripe API
    // 需要 STRIPE_SECRET_KEY 环境变量
    
    // 模拟不同计划的 Stripe 价格 ID
    const priceIds: Record<string, string> = {
      pro: 'price_pro_monthly',
      enterprise: 'price_enterprise_monthly'
    }

    const priceId = priceIds[planId]
    if (!priceId) {
      return NextResponse.json({ error: '无效的计划' }, { status: 400 })
    }

    // 实际集成时，这里调用 stripe.checkout.sessions.create
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const session = await stripe.checkout.sessions.create({...})
    
    // 简化版本：返回前端支付页链接
    const checkoutUrl = `/subscription/checkout?plan=${planId}`
    
    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: '创建支付会话失败' }, { status: 500 })
  }
}
