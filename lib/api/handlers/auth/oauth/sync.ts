/**
 * After OAuth redirect, exchange Auth.js session for app JWT (auth-token cookie).
 */
import { Auth } from '@auth/core'
import { localizedErrorResponse, localizedSuccessResponse } from '../../../localizedError'
import { buildAuthSetCookie } from '../../../authCookie'
import { getOAuthConfig, isAnyOAuthConfigured, OAUTH_BASE_PATH } from '../../../../auth/oauthConfig'
import { createJWT } from '../../../../../src/lib/jwt'
import { prisma } from '../../../../../src/lib/prisma'

export async function POST(request: Request) {
  if (!isAnyOAuthConfigured()) {
    return localizedErrorResponse(request, 'api.auth.oauthNotConfigured', 501)
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
      return localizedErrorResponse(request, 'api.auth.oauthSessionInvalid', 401)
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
      return localizedErrorResponse(request, 'api.auth.oauthUserNotFound', 401)
    }

    const token = createJWT(user)

    return localizedSuccessResponse(
      request,
      'api.auth.oauthSyncOk',
      { success: true, user },
      200,
      undefined,
      { 'Set-Cookie': buildAuthSetCookie(token) },
    )
  } catch (error) {
    console.error('[OAuth sync] error:', error)
    return localizedErrorResponse(request, 'api.auth.oauthSyncFailed', 500)
  }
}
