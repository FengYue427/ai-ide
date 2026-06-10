import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/apiUtils', () => ({
  getApiBaseUrl: vi.fn(() => 'https://api.example.com'),
  buildApiUrl: vi.fn((path: string) => `https://api.example.com${path}`),
}))

vi.mock('../services/desktopBridge', () => ({
  isDesktopApp: vi.fn(() => true),
}))

vi.mock('./desktopAuthToken', () => ({
  needsCrossOriginAuth: vi.fn(() => true),
}))

describe('externalNavigation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds OAuth callback with desktop return flag', async () => {
    const { buildOAuthCallbackUrl } = await import('./externalNavigation')
    expect(buildOAuthCallbackUrl()).toBe(
      'https://api.example.com/?oauth_sync=1&desktop_shell=1',
    )
  })

  it('detects desktop shell return from query params', async () => {
    const { shouldReturnToDesktopShell } = await import('./externalNavigation')
    const params = new URLSearchParams('oauth_sync=1&desktop_shell=1')
    expect(shouldReturnToDesktopShell(params)).toBe(true)
    params.delete('desktop_shell')
    expect(shouldReturnToDesktopShell(params)).toBe(false)
  })

  it('adds desktopShell to checkout payload on desktop cross-origin', async () => {
    const { appendDesktopCheckoutFields } = await import('./externalNavigation')
    expect(appendDesktopCheckoutFields({ planId: 'pro', channel: 'stripe' })).toEqual({
      planId: 'pro',
      channel: 'stripe',
      desktopShell: true,
    })
  })
})
