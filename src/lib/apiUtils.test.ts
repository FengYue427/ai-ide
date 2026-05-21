import { describe, expect, it } from 'vitest'
import { formatFetchError } from '../services/apiUtils'

describe('formatFetchError', () => {
  it('maps fetch TypeError to network message', () => {
    expect(formatFetchError(new TypeError('Failed to fetch'))).toContain('无法连接服务器')
  })

  it('uses Error message when present', () => {
    expect(formatFetchError(new Error('自定义'))).toBe('自定义')
  })
})
