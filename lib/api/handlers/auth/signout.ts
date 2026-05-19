/**
 * 登出 API - 清除会话
 *
 * - 清除 auth-token cookie
 */
import { buildAllAuthClearCookies } from '../../authCookie'

function signoutResponse(): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  for (const cookie of buildAllAuthClearCookies()) {
    headers.append('Set-Cookie', cookie)
  }
  return new Response(JSON.stringify({ success: true }), { status: 200, headers })
}

export async function POST(_req: Request) {
  return signoutResponse()
}

export async function GET(_req: Request) {
  return signoutResponse()
}
