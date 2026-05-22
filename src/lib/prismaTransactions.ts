import { shouldUseNeonAdapter } from './dbUrl'

/** PrismaNeonHTTP does not support `$transaction` (nested writes may also fail). */
export function prismaSupportsTransactions(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? ''
  if (!url) return true
  return !shouldUseNeonAdapter(url)
}
