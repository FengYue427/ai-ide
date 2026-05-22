import { Auth } from '@auth/core'
import { authJsonError } from '../api/localizedError'
import { getOAuthConfig, isAnyOAuthConfigured } from './oauthConfig'

export async function handleOAuthRequest(request: Request): Promise<Response> {
  if (!isAnyOAuthConfigured()) {
    return authJsonError(request, 'api.auth.oauthNotConfigured', 501)
  }

  try {
    return await Auth(request, getOAuthConfig())
  } catch (error) {
    console.error('[OAuth] handler error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'OAuth 处理失败',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
