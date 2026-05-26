import { afterEach, describe, expect, it } from 'vitest'
import { getCronSecrets, isCronAuthorized } from './cronAuth'

describe('cronAuth', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET
    delete process.env.BILLING_CRON_SECRET
  })

  it('rejects when no secrets configured', () => {
    const req = new Request('http://localhost/api/billing/expire-subscriptions', {
      headers: { authorization: 'Bearer x' },
    })
    expect(isCronAuthorized(req)).toBe(false)
  })

  it('accepts CRON_SECRET bearer (Vercel Cron)', () => {
    process.env.CRON_SECRET = 'vercel-auto'
    const req = new Request('http://localhost/', {
      headers: { authorization: 'Bearer vercel-auto' },
    })
    expect(isCronAuthorized(req)).toBe(true)
  })

  it('accepts BILLING_CRON_SECRET when different from CRON_SECRET', () => {
    process.env.CRON_SECRET = 'vercel-auto'
    process.env.BILLING_CRON_SECRET = 'manual-ops'
    expect(getCronSecrets()).toHaveLength(2)
    const manual = new Request('http://localhost/', {
      headers: { authorization: 'Bearer manual-ops' },
    })
    expect(isCronAuthorized(manual)).toBe(true)
  })

  it('rejects wrong bearer', () => {
    process.env.CRON_SECRET = 'vercel-auto'
    const req = new Request('http://localhost/', {
      headers: { authorization: 'Bearer wrong' },
    })
    expect(isCronAuthorized(req)).toBe(false)
  })
})
