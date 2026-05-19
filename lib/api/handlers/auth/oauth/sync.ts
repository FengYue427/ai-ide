/**
 * After OAuth redirect, exchange Auth.js session for app JWT (auth-token cookie).
 */
import { Auth } from '@auth/core'
import { jsonResponse, errorResponse } from '../../../http'
import { buildAuthSetCookie } from '../../../authCookie'
import { getOAuthConfig, isAnyOAuthConfigured, OAUTH_BASE_PATH } from '../../../../auth/oauthConfig'
import { createJWT } from '../../../../../src/lib/jwt'
import { prisma } from '../../../../../src/lib/prisma'

export async function POST(request: Request) {
  if (!isAnyOAuthConfigured()) {
    return errorResponse('OAuth 未配置', 501)
  }

  try {
    const origin = new URL(request.url).origin
    const sessionRequest = new Request(`${origin}${OAUTH_BASE_PATH}/session`, {
      method: 'GET',
      headers: request.headers,
    })

    const sessionResponse = await Auth(sessionRequest, getOAuthConfig())
    const sessionBody = (await sessionResponse.json().catch(() => null)) as {
      user?: { email?: string | null; name?: string | null; image?: string | null; id?: string }
    } | null

    const email = sessionBody?.user?.email?.trim().toLowerCase()
    if (!email) {
      return errorResponse('OAuth 会话无效，请重新登录', 401)
    }

    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true },
    })

    if (!user && sessionBody?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: sessionBody.user.id },
        select: { id: true, email: true, name: true, image: true },
      })
    }

    if (!user) {
      return errorResponse('未找到 OAuth 用户，请重试', 401)
    }

    const token = createJWT(user)

    return jsonResponse(
      { success: true, user },
      200,
      { 'Set-Cookie': buildAuthSetCookie(token) },
    )
  } catch (error) {
    console.error('[OAuth sync] error:', error)
    return errorResponse('OAuth 同步失败', 500)
  }
}
