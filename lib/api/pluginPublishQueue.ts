/** In-memory plugin publish review queue (v1.2.7 F3). Resets on cold start — ops via logs + this list. */

export type PluginPublishReviewRecord = {
  reviewId: string
  status: 'pending'
  pluginId: string
  version: string
  manifestHash: string
  submitterUserId: string
  submittedAt: string
}

const MAX_QUEUE = 50
const queue: PluginPublishReviewRecord[] = []

export function enqueuePluginPublishReview(record: PluginPublishReviewRecord): void {
  queue.unshift(record)
  if (queue.length > MAX_QUEUE) queue.length = MAX_QUEUE
}

export function listPluginPublishReviewsForUser(
  userId: string,
  limit = 10,
  status?: 'pending',
): PluginPublishReviewRecord[] {
  return queue
    .filter((row) => row.submitterUserId === userId && (!status || row.status === status))
    .slice(0, limit)
}

export function findPluginPublishReviewInQueue(
  userId: string,
  reviewId: string,
): PluginPublishReviewRecord | null {
  return (
    queue.find((row) => row.submitterUserId === userId && row.reviewId === reviewId) ?? null
  )
}

/** Test-only */
export function clearPluginPublishReviewQueue(): void {
  queue.length = 0
}
