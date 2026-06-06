/**
 * GET /api/plugins/publish/reviews — recent publish submissions for current user.
 * Query: ?status=pending (v1.2.9 F3)
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPluginPublishEnabled } from '../../pluginPublishConfig'
import {
  listPluginPublishReviewsFromDb,
  type PluginPublishReviewRow,
} from '../../pluginPublishDb'
import {
  listPluginPublishReviewsForUser,
  type PluginPublishReviewRecord,
} from '../../pluginPublishQueue'
import { requireAuth } from '../../requireAuth'

function parseStatusFilter(req: Request): 'pending' | undefined {
  const status = new URL(req.url).searchParams.get('status')?.trim().toLowerCase()
  return status === 'pending' ? 'pending' : undefined
}

function recordToRow(record: PluginPublishReviewRecord): PluginPublishReviewRow {
  return {
    reviewId: record.reviewId,
    status: record.status,
    pluginId: record.pluginId,
    version: record.version,
    manifestHash: record.manifestHash,
    submittedAt: record.submittedAt,
  }
}

/** Memory queue first, then DB — DB wins on duplicate reviewId. */
function mergePluginPublishReviews(
  memoryReviews: PluginPublishReviewRecord[],
  dbReviews: PluginPublishReviewRow[] | null,
  limit: number,
): PluginPublishReviewRow[] {
  const byId = new Map<string, PluginPublishReviewRow>()
  for (const row of memoryReviews.map(recordToRow)) {
    byId.set(row.reviewId, row)
  }
  if (dbReviews) {
    for (const row of dbReviews) {
      byId.set(row.reviewId, row)
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, limit)
}

export async function GET(req: Request) {
  if (!isPluginPublishEnabled()) {
    return jsonResponse({ reviews: [], publishEnabled: false })
  }

  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const status = parseStatusFilter(req)

  try {
    const memoryReviews = listPluginPublishReviewsForUser(auth.user.id, 10, status)
    const dbReviews = await listPluginPublishReviewsFromDb(auth.user.id, 10, status)
    const reviews = mergePluginPublishReviews(memoryReviews, dbReviews, 10)
    return jsonResponse({ reviews, publishEnabled: true, status: status ?? 'all' })
  } catch (error) {
    console.error('[PluginPublishReviews] error:', error)
    return localizedErrorResponse(req, 'api.plugin.publishFailed', 500)
  }
}
