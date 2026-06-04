import { apiFetch, readJsonResponse } from './apiUtils'
import { saveLocalPluginPublishReview, type PluginPublishReviewItem } from './pluginPublishReviewService'

export type PluginPublishSubmitResult =
  | { ok: true; review: PluginPublishReviewItem }
  | { ok: false; errorKey?: string; message?: string }

export async function submitPluginForPublish(packageJson: string): Promise<PluginPublishSubmitResult> {
  let body: unknown
  try {
    body = { package: JSON.parse(packageJson.trim()) }
  } catch {
    return { ok: false, message: 'Invalid JSON' }
  }

  try {
    const response = await apiFetch('/api/plugins/publish', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readJsonResponse<{
      reviewId?: string
      status?: string
      pluginId?: string
      version?: string
      manifestHash?: string
      submittedAt?: string
      errorKey?: string
      message?: string
    }>(response)

    if (response.status === 202 && data?.reviewId) {
      const review: PluginPublishReviewItem = {
        reviewId: data.reviewId,
        status: 'pending',
        pluginId: data.pluginId ?? 'unknown',
        version: data.version ?? '0.0.0',
        manifestHash: data.manifestHash,
        submittedAt: data.submittedAt ?? new Date().toISOString(),
      }
      saveLocalPluginPublishReview(review)
      return { ok: true, review }
    }

    return {
      ok: false,
      errorKey: data?.errorKey,
      message: data?.message ?? `HTTP ${response.status}`,
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Network error' }
  }
}
