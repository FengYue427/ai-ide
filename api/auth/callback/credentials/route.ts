/**
 * 登录 API - 邮箱+密码认证
 * 
 * - 验证邮箱和密码
 * - bcryptjs 比对密码哈希
 * - 创建 JWT 会话
 */
import { prisma } from '../../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { createJWT } from '../../../../src/lib/jwt'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // 验证输入
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "邮箱和密码必填" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.password) {
      return new Response(JSON.stringify({ error: "邮箱或密码错误" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return new Response(JSON.stringify({ error: "邮箱或密码错误" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建 JWT Token
    const token = createJWT({
      id: user.id,
      email: user.email,
      name: user.name
    })

    console.log("[Auth] User logged in:", user.email)

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      token
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` // 7天
      }
    })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return new Response(JSON.stringify({ error: "登录失败，请稍后重试" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
