/** Shared auth for Vercel Cron and manual billing ops. */

export function getCronSecrets(): string[] {
  const values = [process.env.CRON_SECRET, process.env.BILLING_CRON_SECRET]
  const unique = new Set<string>()
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) unique.add(trimmed)
  }
  return [...unique]
}

export function isCronAuthorized(request: Request): boolean {
  const secrets = getCronSecrets()
  if (secrets.length === 0) return false

  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return false

  return secrets.includes(token)
}
