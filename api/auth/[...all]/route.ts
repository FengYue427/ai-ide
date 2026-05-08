/**
 * Auth API - Providers 和 CSRF 端点
 * 
 * 支持邮箱+密码登录，可扩展 OAuth
 */
import { randomBytes } from 'crypto'

// 生成 CSRF Token
export const GET = (req: Request) => {
  const url = new URL(req.url)
  const pathname = url.pathname

  // 获取可用登录方式
  if (pathname.includes('providers')) {
    return new Response(JSON.stringify({
      credentials: {
        id: "credentials",
        name: "邮箱密码",
        type: "credentials"
      }
      // 未来可扩展: github, google
    }), {
      headers: { "Content-Type": "application/json" }
    })
  }

  // CSRF Token
  return new Response(JSON.stringify({
    csrfToken: randomBytes(32).toString('hex')
  }), {
    headers: { "Content-Type": "application/json" }
  })
}
