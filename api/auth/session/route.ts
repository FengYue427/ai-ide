/**
 * 会话 API - 获取当前登录用户信息
 * 
 * - 验证 JWT Token
 * - 返回用户基本信息
 */
import { prisma } from '../../../src/lib/prisma'
import { verifyJWT, getTokenFromRequest } from '../../../src/lib/jwt'

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证 JWT
    const payload = verifyJWT(token)
    if (!payload) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 从数据库获取最新用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    })

    if (!user) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      user,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[Auth] Session error:', error)
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
