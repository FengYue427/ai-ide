import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '../../lib/auth/config'

export const dynamic = 'force-dynamic'

// 获取当前用户订阅状态
export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 简化版本：返回默认免费计划
    // 实际生产环境应从数据库读取用户订阅
    const subscription = {
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Failed to fetch subscription:', error)
    return NextResponse.json({ error: '获取订阅状态失败' }, { status: 500 })
  }
}
