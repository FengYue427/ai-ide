import { describe, expect, it, vi } from 'vitest'
import { getDesktopDownloadUrl, shouldShowDesktopDownload } from './desktopDownload'

vi.mock('./deployContext', () => ({
  isSelfHostedDeploy: vi.fn(() => true),
}))

vi.mock('./externalNavigation', () => ({
  resolveAppUrl: (path: string) => `https://example.com${path}`,
}))

describe('desktopDownload', () => {
  it('builds default download path on self-hosted deploy', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.7.0')
    vi.stubEnv('VITE_DESKTOP_DOWNLOAD_URL', '')
    expect(getDesktopDownloadUrl()).toBe('https://example.com/downloads/AI-IDE-1.7.0-win-portable.exe')
  })

  it('respects explicit download URL override', () => {
    vi.stubEnv('VITE_DESKTOP_DOWNLOAD_URL', '/downloads/custom.exe')
    expect(getDesktopDownloadUrl()).toBe('https://example.com/downloads/custom.exe')
  })

  it('hides download CTA in desktop shell', () => {
    expect(shouldShowDesktopDownload(true)).toBe(false)
    expect(shouldShowDesktopDownload(false)).toBe(true)
  })
})
