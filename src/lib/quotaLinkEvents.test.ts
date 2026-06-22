import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getLastAideLinkEvent } from './aideLinkBus'
import { emitQuotaBlocked, maybeEmitQuotaNearLimit } from './quotaLinkEvents'

const sessionStore: Record<string, string> = {}

describe('quotaLinkEvents', () => {
  beforeEach(() => {
    for (const key of Object.keys(sessionStore)) delete sessionStore[key]
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => sessionStore[key] ?? null,
      setItem: (key: string, value: string) => {
        sessionStore[key] = value
      },
      removeItem: (key: string) => {
        delete sessionStore[key]
      },
      clear: () => {
        for (const key of Object.keys(sessionStore)) delete sessionStore[key]
      },
    })
  })

  it('emits near-limit once per day', () => {
    maybeEmitQuotaNearLimit({ allowed: true, used: 170, limit: 200, remaining: 30, plan: 'free' })
    expect(getLastAideLinkEvent()?.type).toBe('quota-exceeded')
    expect(getLastAideLinkEvent()?.payload?.nearLimit).toBe('true')

    maybeEmitQuotaNearLimit({ allowed: true, used: 180, limit: 200, remaining: 20, plan: 'free' })
    expect(getLastAideLinkEvent()?.payload?.used).toBe('170')
  })

  it('emits blocked event', () => {
    emitQuotaBlocked({ allowed: false, used: 200, limit: 200, remaining: 0, plan: 'free' })
    expect(getLastAideLinkEvent()?.payload?.blocked).toBe('true')
  })
})
