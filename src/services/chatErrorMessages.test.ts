import { describe, expect, it } from 'vitest'
import { classifyChatError } from './chatErrorMessages'

describe('chatErrorMessages', () => {
  it('classifies network errors', () => {
    expect(classifyChatError('Failed to fetch')).toBe('network')
  })

  it('classifies auth errors', () => {
    expect(classifyChatError('HTTP 401 Unauthorized')).toBe('unauthorized')
  })

  it('classifies quota errors', () => {
    expect(classifyChatError('429 Too Many Requests')).toBe('quota')
  })

  it('classifies payload errors', () => {
    expect(classifyChatError('413 Content Too Large')).toBe('payload')
  })
})
