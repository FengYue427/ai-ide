/**
 * 注册 API - 生产实现
 */
import { prisma } from '../../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { createJWT } from '../../../../src/lib/jwt'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { buildAuthSetCookie } from '../../authCookie'
import { trackServerEvent } from '../../logger'
import { appendApiMessage, authJsonError } from '../../localizedError'

export async function POST(req: Request) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions('auth:register'))
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const { email, password, name } = await req.json()

    if (!email || !password) {
      return authJsonError(req, 'api.auth.required', 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return authJsonError(req, 'api.auth.invalidEmail', 400)
    }

    if (password.length < 8) {
      return authJsonError(req, 'api.auth.passwordMin', 400)
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return authJsonError(req, 'api.auth.emailTaken', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        workspaces: {
          create: {
            name: 'default',
            files: '[]',
            settings: '{}',
            isDefault: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    })

    const token = createJWT(user)

    console.log('[Auth] User registered:', user.email)
    trackServerEvent(req, 'auth.register.success', { userId: user.id })

    return new Response(
      JSON.stringify(appendApiMessage(req, 'api.auth.registerOk', { success: true, user })),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildAuthSetCookie(token),
        },
      },
    )
  } catch (error) {
    console.error('[Auth] Registration error:', error)
    return authJsonError(req, 'api.auth.registerFailed', 500)
  }
}
