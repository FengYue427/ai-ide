/**
 * GET /api/plugins/publish/reviews — recent publish submissions for current user (in-memory).
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import { listPluginPublishReviewsFromDb } from '../../pluginPublishDb'
import { listPluginPublishReviewsForUser } from '../../pluginPublishQueue'
import { requireAuth } from '../../requireAuth'

export async function GET(req: Request) {
  if (!isPluginPublishEnabled()) {
    return jsonResponse({ reviews: [], publishEnabled: false })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const dbReviews = await listPluginPublishReviewsFromDb(auth.user.id, 10)
    const reviews =
      dbReviews && dbReviews.length > 0
        ? dbReviews
        : listPluginPublishReviewsForUser(auth.user.id, 10)
    return jsonResponse({ reviews, publishEnabled: true })
  } catch (error) {
    console.error('[PluginPublishReviews] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
