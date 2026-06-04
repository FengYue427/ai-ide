import { apiFetch, readJsonResponse } from './apiUtils'

export type PluginPublishReviewItem = {
  reviewId: string
  status: 'pending'
  pluginId: string
  version: string
  manifestHash?: string
  submittedAt: string
}

const LS_KEY = 'ai-ide:plugin-publish-reviews'

export function loadLocalPluginPublishReviews(): PluginPublishReviewItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PluginPublishReviewItem[]
    return Array.isArray(parsed) ? parsed.slice(0, 10) : []
  } catch {
    return []
  }
}

export function saveLocalPluginPublishReview(item: PluginPublishReviewItem): void {
  if (typeof localStorage === 'undefined') return
  const existing = loadLocalPluginPublishReviews().filter((row) => row.reviewId !== item.reviewId)
  localStorage.setItem(LS_KEY, JSON.stringify([item, ...existing].slice(0, 10)))
}

export async function fetchPluginPublishReviews(
  signal?: AbortSignal,
): Promise<PluginPublishReviewItem[]> {
  try {
    const response = await apiFetch('/api/plugins/publish/reviews', {
      credentials: 'include',
      signal,
    })
    const data = await readJsonResponse<{ reviews?: PluginPublishReviewItem[] }>(response)
    if (!response.ok || !Array.isArray(data?.reviews)) return loadLocalPluginPublishReviews()
    return data.reviews
  } catch {
    return loadLocalPluginPublishReviews()
  }
}
