import { checkRateLimit, resolveRateLimitOptions } from '../../../lib/api/rateLimit'
import { rateLimitErrorResponse } from '../../../lib/api/rateLimitResponse'

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, resolveRateLimitOptions('auth:forgot'))
    if (!rate.allowed) return rateLimitErrorResponse(rate)

    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "邮箱必填" }), {
        status: 400
      })
    }

    console.log("Forgot password for:", email)

    // 无论用户是否存在，都返回成功（防止邮箱枚举）
    return new Response(JSON.stringify({
      success: true,
      demo: true,
      message: '暂未接入真实邮件服务；请使用注册邮箱直接登录，或联系管理员重置密码。',
    }), {
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "发送失败" }), {
      status: 500
    })
  }
}
