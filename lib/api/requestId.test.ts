import { describe, expect, it } from 'vitest'
import { attachRequestId, createRequestId, resolveRequestId } from './requestId'

describe('requestId', () => {
  it('creates non-empty ids', () => {
    expect(createRequestId().length).toBeGreaterThan(8)
  })

  it('reuses incoming x-request-id', () => {
    const req = new Request('http://localhost/api/health', {
      headers: { 'x-request-id': 'abc-123' },
    })
    expect(resolveRequestId(req)).toBe('abc-123')
  })

  it('attaches response header', () => {
    const res = attachRequestId(new Response('ok'), 'rid-1')
    expect(res.headers.get('X-Request-Id')).toBe('rid-1')
  })
})
