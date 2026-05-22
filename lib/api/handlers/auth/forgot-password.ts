import { apiMessage } from '../../../i18n/apiMessages'
import { resolveRequestLocale } from '../../../i18n/resolveLocale'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { authJsonError } from '../../localizedError'

export async function POST(req: Request) {
  try {
    const rate = await checkRateLimitDistributed(req, resolveRateLimitOptions('auth:forgot'))
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const { email } = await req.json()

    if (!email) {
      return authJsonError(req, 'api.auth.emailRequired', 400)
    }

    console.log('Forgot password for:', email)

    const locale = resolveRequestLocale(req)
    return new Response(
      JSON.stringify({
        success: true,
        demo: true,
        message: apiMessage('api.auth.forgotDemoMessage', locale),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch {
    return authJsonError(req, 'api.auth.sendFailed', 500)
  }
}
