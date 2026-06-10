import { describe, expect, it } from 'vitest'
import {
  buildBillingDesktopDeepLink,
  buildDesktopDeepLinkUrl,
  buildOAuthDesktopDeepLink,
  parseDesktopDeepLink,
} from './desktopDeepLink'

describe('desktopDeepLink', () => {
  it('builds and parses oauth deep link', () => {
    const url = buildOAuthDesktopDeepLink('jwt-token')
    expect(url).toBe('ai-ide://return?kind=oauth&token=jwt-token')
    expect(parseDesktopDeepLink(url)).toEqual({
      kind: 'oauth',
      params: { kind: 'oauth', token: 'jwt-token' },
    })
  })

  it('builds billing deep link from search params', () => {
    const params = new URLSearchParams('subscription=success&plan=pro&desktop_shell=1')
    const url = buildBillingDesktopDeepLink(params)
    expect(url).toBe('ai-ide://return?kind=billing&subscription=success&plan=pro')
  })

  it('buildDesktopDeepLinkUrl skips empty values', () => {
    expect(buildDesktopDeepLinkUrl({ kind: 'oauth', token: '' })).toBe('ai-ide://return?kind=oauth')
  })
})
