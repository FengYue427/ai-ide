import { describe, expect, it } from 'vitest'
import { apiMessage } from './apiMessages'
import { resolveRequestLocale } from './resolveLocale'

describe('apiMessages', () => {
  it('returns English when Accept-Language prefers en', () => {
    const req = new Request('http://localhost', { headers: { 'Accept-Language': 'en-US,en;q=0.9' } })
    expect(resolveRequestLocale(req)).toBe('en-US')
    expect(apiMessage('api.auth.unauthorized', 'en-US')).toBe('Not signed in')
  })

  it('prefers X-App-Language over Accept-Language', () => {
    const req = new Request('http://localhost', {
      headers: { 'Accept-Language': 'en-US', 'X-App-Language': 'zh-CN' },
    })
    expect(resolveRequestLocale(req)).toBe('zh-CN')
  })

  it('interpolates workspace limit params', () => {
    expect(apiMessage('api.workspace.limitReached', 'en-US', { limit: 10 })).toContain('10')
  })
})
