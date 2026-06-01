/**
 * POST /api/plugins/publish — v1.2 F4 stub (202 + manual review queue).
 * Requires PLUGIN_PUBLISH_ENABLED=true and authenticated user.
 */
import { readJsonWithLimit } from '../../body'
import { localizedErrorResponse, localizedSuccessResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import { createPluginPublishReview, validatePluginPublishBody } from '../../pluginPublishService'
import { requireAuth } from '../../requireAuth'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'

const MAX_PUBLISH_BODY_BYTES = 64 * 1024

export async function POST(req: Request) {
  if (!isPluginPublishEnabled()) {
    return localizedErrorResponse(req, 'api.plugin.publishDisabled', 503)
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('plugins:publish'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const parsed = await readJsonWithLimit<unknown>(req, MAX_PUBLISH_BODY_BYTES)
    if (!parsed.ok) return parsed.response

    const validation = validatePluginPublishBody(parsed.value)
    if (!validation.ok) {
      return localizedErrorResponse(req, validation.errorKey, 400, validation.params)
    }

    const review = createPluginPublishReview(validation.pkg, auth.user.id)
    return localizedSuccessResponse(req, 'api.plugin.publishAccepted', review, 202)
  } catch (error) {
    console.error('[PluginPublish] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
