import { apiFetch, readJsonResponse } from './apiUtils'

export type PluginPublishReviewStatus = 'pending'

export type PluginPublishReviewItem = {
  reviewId: string
  status: PluginPublishReviewStatus
  pluginId: string
  version: string
  manifestHash?: string
  submittedAt: string
}

export type PluginPublishReviewFilter = 'all' | 'pending'

const LS_KEY = 'ai-ide:plugin-publish-reviews'

export function loadLocalPluginPublishReviews(
  filter: PluginPublishReviewFilter = 'all',
): PluginPublishReviewItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PluginPublishReviewItem[]
    if (!Array.isArray(parsed)) return []
    const rows = parsed.slice(0, 10)
    return filter === 'pending' ? rows.filter((row) => row.status === 'pending') : rows
  } catch {
    return []
  }
}

export function saveLocalPluginPublishReview(item: PluginPublishReviewItem): void {
  if (typeof localStorage === 'undefined') return
  const existing = loadLocalPluginPublishReviews().filter((row) => row.reviewId !== item.reviewId)
  localStorage.setItem(LS_KEY, JSON.stringify([item, ...existing].slice(0, 10)))
}

function buildReviewsUrl(filter: PluginPublishReviewFilter): string {
  if (filter === 'pending') return '/api/plugins/publish/reviews?status=pending'
  return '/api/plugins/publish/reviews'
}

export async function fetchPluginPublishReviews(options?: {
  filter?: PluginPublishReviewFilter
  signal?: AbortSignal
}): Promise<PluginPublishReviewItem[]> {
  const filter = options?.filter ?? 'all'
  try {
    const response = await apiFetch(buildReviewsUrl(filter), {
      credentials: 'include',
      signal: options?.signal,
    })
    const data = await readJsonResponse<{ reviews?: PluginPublishReviewItem[] }>(response)
    if (!response.ok || !Array.isArray(data?.reviews)) {
      return loadLocalPluginPublishReviews(filter)
    }
    return data.reviews
  } catch {
    return loadLocalPluginPublishReviews(filter)
  }
}

export async function fetchPluginPublishReviewById(
  reviewId: string,
  signal?: AbortSignal,
): Promise<PluginPublishReviewItem | null> {
  try {
    const response = await apiFetch(
      `/api/plugins/publish/reviews/${encodeURIComponent(reviewId)}`,
      {
        credentials: 'include',
        signal,
      },
    )
    const data = await readJsonResponse<{ review?: PluginPublishReviewItem | null }>(response)
    if (!response.ok || !data?.review) return null
    return data.review
  } catch {
    return loadLocalPluginPublishReviews().find((row) => row.reviewId === reviewId) ?? null
  }
}
