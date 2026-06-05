import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchPluginPublishReviews,
  loadLocalPluginPublishReviews,
  type PluginPublishReviewItem,
} from './pluginPublishReviewService'

const seed: PluginPublishReviewItem[] = [
  {
    reviewId: 'rev_e2e_community_sample',
    status: 'pending',
    pluginId: 'community-sample',
    version: '1.0.0',
    manifestHash: 'e2e000000000000',
    submittedAt: new Date().toISOString(),
  },
]

const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
})

describe('pluginPublishReviewService', () => {
  beforeEach(() => {
    storage.clear()
    storage.set('ai-ide:plugin-publish-reviews', JSON.stringify(seed))
    vi.restoreAllMocks()
  })

  it('falls back to local reviews when API returns empty success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ reviews: [], publishEnabled: false }),
      ),
    )

    const rows = await fetchPluginPublishReviews({ filter: 'pending' })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.pluginId).toBe('community-sample')
  })

  it('filters local reviews by pending', () => {
    storage.set(
      'ai-ide:plugin-publish-reviews',
      JSON.stringify([
        ...seed,
        {
          reviewId: 'rev_done',
          status: 'pending',
          pluginId: 'other',
          version: '2.0.0',
          submittedAt: new Date().toISOString(),
        },
      ]),
    )
    expect(loadLocalPluginPublishReviews('pending')).toHaveLength(2)
  })
})
