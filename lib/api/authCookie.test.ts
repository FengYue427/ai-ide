import { describe, expect, it, afterEach } from 'vitest'
import { buildAllAuthClearCookies, buildAuthClearCookie, buildAuthSetCookie } from './authCookie'

describe('authCookie', () => {
  const prevNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv
  })

  it('includes Secure in production', () => {
    process.env.NODE_ENV = 'production'
    expect(buildAuthSetCookie('tok')).toContain('; Secure')
    expect(buildAuthClearCookie()).toContain('; Secure')
  })

  it('omits Secure in development', () => {
    process.env.NODE_ENV = 'development'
    expect(buildAuthSetCookie('tok')).not.toContain('Secure')
  })

  it('clears app and oauth cookies', () => {
    const cookies = buildAllAuthClearCookies()
    expect(cookies.length).toBeGreaterThan(1)
    expect(cookies.some((c) => c.startsWith('auth-token='))).toBe(true)
    expect(cookies.some((c) => c.includes('authjs.session-token'))).toBe(true)
  })
})
