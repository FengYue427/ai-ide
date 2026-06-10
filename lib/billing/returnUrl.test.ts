import { describe, expect, it } from 'vitest'
import { buildAppReturnUrl } from './returnUrl'

describe('buildAppReturnUrl', () => {
  it('adds desktop_shell when requested', () => {
    expect(
      buildAppReturnUrl('https://api.example.com', { subscription: 'success', plan: 'pro' }, { desktopShell: true }),
    ).toBe('https://api.example.com/?subscription=success&plan=pro&desktop_shell=1')
  })

  it('omits desktop_shell by default', () => {
    expect(buildAppReturnUrl('https://api.example.com/', { subscription: 'canceled' })).toBe(
      'https://api.example.com/?subscription=canceled',
    )
  })
})
