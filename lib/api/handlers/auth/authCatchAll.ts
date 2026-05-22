/**
 * Auth API - Providers 和 CSRF 端点
 *
 * 支持邮箱+密码登录，可扩展 OAuth
 */
import { randomBytes } from 'crypto'
import { apiMessage } from '../../../i18n/apiMessages'
import { resolveRequestLocale } from '../../../i18n/resolveLocale'

// 生成 CSRF Token
export async function GET(req: Request) {
  const url = new URL(req.url)
  const pathname = url.pathname

  // 获取可用登录方式
  if (pathname.includes('providers')) {
    const locale = resolveRequestLocale(req)
    return new Response(JSON.stringify({
      credentials: {
        id: "credentials",
        name: apiMessage('api.auth.credentialsProvider', locale),
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
