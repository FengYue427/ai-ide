/**
 * GET /api/plugins/publish/reviews — recent publish submissions for current user (in-memory).
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import { listPluginPublishReviewsForUser } from '../../pluginPublishQueue'
import { requireAuth } from '../../requireAuth'

export async function GET(req: Request) {
  if (!isPluginPublishEnabled()) {
    return jsonResponse({ reviews: [], publishEnabled: false })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const reviews = listPluginPublishReviewsForUser(auth.user.id, 10)
    return jsonResponse({ reviews, publishEnabled: true })
  } catch (error) {
    console.error('[PluginPublishReviews] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
