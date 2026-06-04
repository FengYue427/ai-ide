import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchPlatformUsageDashboard } from './platformUsageDashboardService'

vi.mock('./apiUtils', () => ({
  apiFetch: vi.fn(),
  readJsonResponse: vi.fn(async (response: Response) => response.json()),
}))

import { apiFetch } from './apiUtils'

describe('fetchPlatformUsageDashboard', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  it('returns dashboard payload when authenticated', async () => {
    const payload = {
      source: 'server' as const,
      quota: { allowed: true, used: 3, limit: 5000, remaining: 4997, plan: 'free' },
      platformToday: 2,
      otherToday: 1,
      costEstimateTodayUsd: 0.004,
      costPerRequestUsd: 0.002,
      periodDays: 7,
      daily: [],
      platformPeriodTotal: 2,
      costEstimatePeriodUsd: 0.004,
    }
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response)

    const result = await fetchPlatformUsageDashboard()
    expect(result).toEqual(payload)
    expect(apiFetch).toHaveBeenCalledWith('/api/usage/dashboard', {
      credentials: 'include',
      signal: undefined,
    })
  })

  it('returns null on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    expect(await fetchPlatformUsageDashboard()).toBeNull()
  })
})
