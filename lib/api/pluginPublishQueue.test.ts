import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearPluginPublishReviewQueue,
  enqueuePluginPublishReview,
  findPluginPublishReviewInQueue,
  listPluginPublishReviewsForUser,
} from './pluginPublishQueue'

describe('pluginPublishQueue', () => {
  beforeEach(() => {
    clearPluginPublishReviewQueue()
  })

  it('lists reviews for submitter only', () => {
    enqueuePluginPublishReview({
      reviewId: 'rev_a',
      status: 'pending',
      pluginId: 'p1',
      version: '1.0.0',
      manifestHash: 'abc',
      submitterUserId: 'user-1',
      submittedAt: '2026-06-04T00:00:00.000Z',
    })
    enqueuePluginPublishReview({
      reviewId: 'rev_b',
      status: 'pending',
      pluginId: 'p2',
      version: '1.0.0',
      manifestHash: 'def',
      submitterUserId: 'user-2',
      submittedAt: '2026-06-04T00:00:01.000Z',
    })

    expect(listPluginPublishReviewsForUser('user-1').map((row) => row.reviewId)).toEqual(['rev_a'])
  })

  it('filters by pending status and finds by reviewId', () => {
    enqueuePluginPublishReview({
      reviewId: 'rev_pending',
      status: 'pending',
      pluginId: 'p1',
      version: '1.0.0',
      manifestHash: 'abc',
      submitterUserId: 'user-1',
      submittedAt: '2026-06-04T00:00:00.000Z',
    })

    expect(listPluginPublishReviewsForUser('user-1', 10, 'pending')).toHaveLength(1)
    expect(findPluginPublishReviewInQueue('user-1', 'rev_pending')?.pluginId).toBe('p1')
    expect(findPluginPublishReviewInQueue('user-1', 'missing')).toBeNull()
  })
})
