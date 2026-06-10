export const DESKTOP_SHELL_QUERY = 'desktop_shell'

/** Build `https://host/?key=value` with optional desktop shell return flag. */
export function buildAppReturnUrl(
  origin: string,
  query: Record<string, string>,
  options?: { desktopShell?: boolean },
): string {
  const params = new URLSearchParams(query)
  if (options?.desktopShell) {
    params.set(DESKTOP_SHELL_QUERY, '1')
  }
  const qs = params.toString()
  return `${origin.replace(/\/$/, '')}/${qs ? `?${qs}` : ''}`
}

export function parseDesktopShellFlag(req: Request): boolean {
  try {
    const url = new URL(req.url)
    return url.searchParams.get(DESKTOP_SHELL_QUERY) === '1'
  } catch {
    return false
  }
}
