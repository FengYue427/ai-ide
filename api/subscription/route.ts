// 获取当前用户订阅状态
export async function GET() {
  // 简化版本：返回默认免费计划
  // 实际生产环境应从数据库读取用户订阅
  const subscription = {
    plan: 'free',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  }

  return new Response(JSON.stringify({ subscription }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
