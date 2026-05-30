import { describe, expect, it } from 'vitest'
import { formatCollabApiError } from './collabApiErrors'

const t = (key: string) => key

describe('formatCollabApiError', () => {
  it('prefers server message', () => {
    expect(formatCollabApiError(500, 'Custom error', 'fallback', t)).toBe('Custom error')
  })

  it('maps HTTP status to i18n keys', () => {
    expect(formatCollabApiError(401, undefined, 'fallback', t)).toBe('collab.m1.error.unauthorized')
    expect(formatCollabApiError(404, undefined, 'fallback', t)).toBe('collab.m1.error.notFound')
    expect(formatCollabApiError(503, undefined, 'fallback', t)).toBe('collab.m1.error.unavailable')
  })

  it('uses fallback for unknown status', () => {
    expect(formatCollabApiError(418, undefined, 'fallback', t)).toBe('fallback')
  })
})
