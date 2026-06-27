import { isSelfHostedDeploy } from './deployContext'
import { resolveAppUrl } from './externalNavigation'

function resolveVersion(): string {
  const version = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim()
  return version || '1.7.0'
}

/** Public URL for the Windows portable build, when hosted on this deploy. */
export function getDesktopDownloadUrl(): string | null {
  const override = (import.meta.env.VITE_DESKTOP_DOWNLOAD_URL as string | undefined)?.trim()
  if (override) {
    return override.startsWith('http://') || override.startsWith('https://')
      ? override
      : resolveAppUrl(override)
  }

  if (!isSelfHostedDeploy()) return null
  return resolveAppUrl(`/downloads/AI-IDE-${resolveVersion()}-win-portable.exe`)
}

export function shouldShowDesktopDownload(isDesktop: boolean): boolean {
  if (isDesktop) return false
  return Boolean(getDesktopDownloadUrl())
}
