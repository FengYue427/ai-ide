import { describe, expect, it } from 'vitest'
import { setApiLanguage } from './apiLanguage'
import { formatFetchError } from '../services/apiUtils'

describe('formatFetchError', () => {
  it('maps fetch TypeError to network message (zh-CN)', () => {
    setApiLanguage('zh-CN')
    expect(formatFetchError(new TypeError('Failed to fetch'))).toContain('无法连接服务器')
  })

  it('maps fetch TypeError to network message (en-US)', () => {
    setApiLanguage('en-US')
    expect(formatFetchError(new TypeError('Failed to fetch'))).toMatch(/Cannot reach the server/i)
  })

  it('uses Error message when present', () => {
    expect(formatFetchError(new Error('custom'))).toBe('custom')
  })
})
