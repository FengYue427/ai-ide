/**
 * 登出 API - 清除会话
 * 
 * - 清除 auth-token cookie
 */
export async function POST(req: Request) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' // 立即过期
    }
  })
}

export async function GET(req: Request) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  })
}
