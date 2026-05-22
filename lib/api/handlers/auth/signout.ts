/**
 * 登出 API - 清除会话
 *
 * - 清除 auth-token cookie
 */
import { buildAllAuthClearCookies } from '../../authCookie'
import { appendApiMessage } from '../../localizedError'

function signoutResponse(req: Request): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  for (const cookie of buildAllAuthClearCookies()) {
    headers.append('Set-Cookie', cookie)
  }
  return new Response(
    JSON.stringify(appendApiMessage(req, 'api.auth.signoutOk', { success: true })),
    { status: 200, headers },
  )
}

export async function POST(req: Request) {
  return signoutResponse(req)
}

export async function GET(req: Request) {
  return signoutResponse(req)
}
