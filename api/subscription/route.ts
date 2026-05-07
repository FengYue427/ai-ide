/**
 * 订阅状态 API - 演示/占位实现
 * 
 * 当前为纯前端模式：
 * - 始终返回免费计划（硬编码）
 * - 前端已禁用订阅相关 UI
 * 
 * 如需完整付费功能，需接入 Stripe + 数据库 + Webhook
 */
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
