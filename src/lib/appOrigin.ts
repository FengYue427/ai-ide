/** Public app origin shown in welcome / settings (v1.0.2.6). */
export function getPublicAppOrigin(): string | null {
  if (typeof window === 'undefined') return null
  const origin = window.location.origin?.trim()
  if (!origin || origin === 'null') return null
  return origin.replace(/\/$/, '')
}

export function isCustomAppOrigin(origin: string): boolean {
  const host = new URL(origin).hostname.toLowerCase()
  return !host.endsWith('.vercel.app') && host !== 'localhost' && host !== '127.0.0.1'
}
