import { describe, expect, it } from 'vitest'
import { buildHealthCheck } from './healthStatus'

describe('buildHealthCheck', () => {
  it('returns degraded when DATABASE_URL is missing', async () => {
    const result = await buildHealthCheck({
      hasDatabaseUrl: false,
      pingDatabase: async () => {},
    })
    expect(result.statusCode).toBe(503)
    expect(result.payload.database).toBe('not_configured')
    expect(result.payload.status).toBe('degraded')
  })

  it('returns ok when database ping succeeds', async () => {
    const result = await buildHealthCheck({
      hasDatabaseUrl: true,
      pingDatabase: async () => {},
    })
    expect(result.statusCode).toBe(200)
    expect(result.payload.database).toBe('connected')
    expect(result.payload.status).toBe('ok')
  })

  it('returns degraded when database ping fails', async () => {
    const result = await buildHealthCheck({
      hasDatabaseUrl: true,
      pingDatabase: async () => {
        throw new Error('connection refused')
      },
    })
    expect(result.statusCode).toBe(503)
    expect(result.payload.database).toBe('unavailable')
  })
})
