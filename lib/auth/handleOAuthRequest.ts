import { Auth } from '@auth/core'
import { getOAuthConfig, isAnyOAuthConfigured } from './oauthConfig'

export async function handleOAuthRequest(request: Request): Promise<Response> {
  if (!isAnyOAuthConfigured()) {
    return new Response(JSON.stringify({ error: 'OAuth 未配置' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    })
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
