/**
 * GET /api/plugins/publish/reviews — recent publish submissions for current user.
 * Query: ?status=pending (v1.2.9 F3)
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import { listPluginPublishReviewsFromDb } from '../../pluginPublishDb'
import { listPluginPublishReviewsForUser } from '../../pluginPublishQueue'
import { requireAuth } from '../../requireAuth'

function parseStatusFilter(req: Request): 'pending' | undefined {
  const status = new URL(req.url).searchParams.get('status')?.trim().toLowerCase()
  return status === 'pending' ? 'pending' : undefined
}

export async function GET(req: Request) {
  if (!isPluginPublishEnabled()) {
    return jsonResponse({ reviews: [], publishEnabled: false })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const status = parseStatusFilter(req)

  try {
    const dbReviews = await listPluginPublishReviewsFromDb(auth.user.id, 10, status)
    const reviews =
      dbReviews != null
        ? dbReviews
        : listPluginPublishReviewsForUser(auth.user.id, 10, status)
    return jsonResponse({ reviews, publishEnabled: true, status: status ?? 'all' })
  } catch (error) {
    console.error('[PluginPublishReviews] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
