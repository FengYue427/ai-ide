/**
 * GET /api/plugins/publish/reviews/:reviewId — read-only review status (v1.2.9 F3).
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import { findPluginPublishReviewForUser } from '../../pluginPublishDb'
import { findPluginPublishReviewInQueue } from '../../pluginPublishQueue'
import { requireAuth } from '../../requireAuth'

export async function GET(
  req: Request,
  ctx?: { params: Record<string, string> },
): Promise<Response> {
  if (!isPluginPublishEnabled()) {
    return jsonResponse({ review: null, publishEnabled: false })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const reviewId = ctx?.params?.reviewId?.trim()
  if (!reviewId) {
    return localizedErrorResponse(req, 'api.plugin.publishInvalidId', 400)
  }

  try {
    const dbReview = await findPluginPublishReviewForUser(auth.user.id, reviewId)
    const review = dbReview ?? findPluginPublishReviewInQueue(auth.user.id, reviewId)
    if (!review) {
      return localizedErrorResponse(req, 'api.plugin.reviewNotFound', 404)
    }
    return jsonResponse({ review, publishEnabled: true })
  } catch (error) {
    console.error('[PluginPublishReviewById] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
