import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FALLBACK = '1.1.3.2'

let cached: string | null = null

/**
 * Resolved at runtime for `/api/health`:
 * `npm run build` on Vercel does not inject `npm_package_version` unless the install
 * step runs npm scripts — read `package.json` next to bundled `api/index.js` instead.
 */
export function getReleaseVersion(): string {
  const fromEnv = process.env.APP_VERSION?.trim() || process.env.npm_package_version?.trim()
  if (fromEnv) return fromEnv

  if (cached) return cached

  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const candidates = [
      join(here, '..', '..', '..', 'package.json'),
      join(here, '..', 'package.json'),
    ]
    for (const pkgPath of candidates) {
      const raw = readFileSync(pkgPath, 'utf8')
      const ver = JSON.parse(raw)?.version
      if (typeof ver === 'string' && ver.trim()) {
        cached = ver.trim()
        return cached
      }
    }
  } catch {
    // ignore — fall through
  }

  return FALLBACK
}
