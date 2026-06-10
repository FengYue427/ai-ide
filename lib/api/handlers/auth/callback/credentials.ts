/**
 * 登录 API - 邮箱+密码认证
 */
import { prisma } from '../../../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { createJWT } from '../../../../../src/lib/jwt'
import { resolveRateLimitOptions } from '../../../rateLimit'
import { checkRateLimitDistributed } from '../../../rateLimitKv'
import { rateLimitErrorResponse } from '../../../rateLimitResponse'
import { buildAuthSetCookie } from '../../../authCookie'
import { trackServerEvent } from '../../../logger'
import { appendApiMessage, authJsonError } from '../../../localizedError'

export async function POST(req: Request) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions('auth:login'))
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const { email, password } = await req.json()

    if (!email || !password) {
      return authJsonError(req, 'api.auth.required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.password) {
      return authJsonError(req, 'api.auth.invalidCredentials', 401)
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return authJsonError(req, 'api.auth.invalidCredentials', 401)
    }

    const token = createJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    console.log('[Auth] User logged in:', user.email)
    trackServerEvent(req, 'auth.login.success', { userId: user.id })

    return new Response(
      JSON.stringify(
        appendApiMessage(req, 'api.auth.loginOk', {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
        }),
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildAuthSetCookie(token),
        },
      },
    )
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return authJsonError(req, 'api.auth.loginFailed', 500)
  }
}
