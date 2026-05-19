import { describe, expect, it } from 'vitest'
import { checkRateLimit } from './rateLimit'

function fakeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', { headers })
}

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const req = fakeRequest({ 'x-forwarded-for': '10.0.0.1' })
    const opts = { key: 'test:unit', limit: 3, windowMs: 60_000 }
    expect(checkRateLimit(req, opts).allowed).toBe(true)
    expect(checkRateLimit(req, opts).allowed).toBe(true)
    expect(checkRateLimit(req, opts).allowed).toBe(true)
  })

  it('blocks when limit exceeded', () => {
    const req = fakeRequest({ 'x-forwarded-for': '10.0.0.2' })
    const opts = { key: 'test:block', limit: 2, windowMs: 60_000 }
    checkRateLimit(req, opts)
    checkRateLimit(req, opts)
    const third = checkRateLimit(req, opts)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSec).toBeGreaterThan(0)
  })
})
