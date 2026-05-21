/** Neon serverless URLs — use HTTP driver (no ws on Vercel). */
export function shouldUseNeonAdapter(connectionString: string): boolean {
  if (process.env.USE_NEON_DRIVER === 'true') return true
  if (process.env.USE_NEON_DRIVER === 'false') return false
  return /neon\.tech/i.test(connectionString)
}

/** channel_binding breaks some serverless drivers. */
export function sanitizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    url.searchParams.delete('channel_binding')
    return url.toString()
  } catch {
    return connectionString.replace(/[&?]channel_binding=[^&]*/gi, '').replace(/\?&/, '?')
  }
}
