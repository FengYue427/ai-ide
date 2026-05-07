import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 获取订阅计划列表
export async function GET() {
  try {
    // 简化版本：返回硬编码的计划列表
    // 实际生产环境应从数据库读取
    const plans = [
      {
        id: 'free',
        name: 'free',
        displayName: '免费版',
        description: '适合个人初学者',
        price: 0,
        currency: 'USD',
        features: [
          '基础 AI 对话 (GPT-3.5)',
          '本地文件编辑',
          '3 个工作区',
          '1GB 云存储'
        ],
        limits: {
          aiRequestsPerDay: 50,
          workspaces: 3,
          storageGB: 1
        }
      },
      {
        id: 'pro',
        name: 'pro',
        displayName: '专业版',
        description: '适合专业开发者',
        price: 9.99,
        currency: 'USD',
        features: [
          '全部 AI 模型访问',
          '优先响应速度',
          '无限工作区',
          '10GB 云存储',
          '团队协作功能',
          '高级代码分析'
        ],
        limits: {
          aiRequestsPerDay: 500,
          workspaces: -1, // 无限
          storageGB: 10
        }
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        displayName: '企业版',
        description: '适合团队和企业',
        price: 29.99,
        currency: 'USD',
        features: [
          '全部专业版功能',
          '私有 AI 模型部署',
          '100GB 云存储',
          'SSO 单点登录',
          '专属技术支持',
          'API 访问权限'
        ],
        limits: {
          aiRequestsPerDay: -1, // 无限
          workspaces: -1,
          storageGB: 100
        }
      }
    ]

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Failed to fetch plans:', error)
    return NextResponse.json({ error: '获取计划列表失败' }, { status: 500 })
  }
}
