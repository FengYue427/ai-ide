import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelBackgroundJob,
  createBackgroundJob,
  isActiveBackgroundJobStatus,
  listBackgroundJobs,
} from './backgroundJobsApiService'

describe('backgroundJobsApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('classifies active statuses', () => {
    expect(isActiveBackgroundJobStatus('queued')).toBe(true)
    expect(isActiveBackgroundJobStatus('running')).toBe(true)
    expect(isActiveBackgroundJobStatus('succeeded')).toBe(false)
  })

  it('createBackgroundJob posts prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          job: { id: 'j1', status: 'queued', prompt: 'hi', repoKey: null, progress: null, result: null, error: null, createdAt: '', startedAt: null, finishedAt: null },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { job } = await createBackgroundJob({ prompt: 'hi' })
    expect(job?.id).toBe('j1')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('listBackgroundJobs returns empty on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'nope' }), { status: 401 })),
    )
    const { jobs, error } = await listBackgroundJobs()
    expect(jobs).toEqual([])
    expect(error).toBeTruthy()
  })

  it('cancelBackgroundJob calls cancel endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          job: { id: 'j1', status: 'cancelled', prompt: 'x', repoKey: null, progress: null, result: null, error: null, createdAt: '', startedAt: null, finishedAt: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { job } = await cancelBackgroundJob('j1')
    expect(job?.status).toBe('cancelled')
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/cancel')
  })
})
