/**
 * 注册 API - 生产实现
 * 
 * - Prisma 写入 PostgreSQL 数据库
 * - bcryptjs 密码哈希
 * - JWT 创建会话
 */
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { createJWT } from '../../../src/lib/jwt'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    // 验证输入
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "邮箱和密码必填" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "请输入有效的邮箱地址" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "密码至少需要8位" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (existing) {
      return new Response(JSON.stringify({ error: "邮箱已注册" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0]
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    })

    // 创建 JWT Token
    const token = createJWT(user)

    console.log("[Auth] User registered:", user.email)
    
    return new Response(JSON.stringify({ 
      success: true,
      user,
      token
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` // 7天
      }
    })
  } catch (error) {
    console.error('[Auth] Registration error:', error)
    return new Response(JSON.stringify({ error: "注册失败，请稍后重试" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
