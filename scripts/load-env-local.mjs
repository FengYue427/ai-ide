/**
 * Load .env.local into process.env (does not override existing vars).
 * Supports multiline values in double/single quotes (PEM keys).
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * @param {string} content
 * @returns {Array<[string, string]>}
 */
export function parseEnvLocalContent(content) {
  const lines = content.split(/\r?\n/)
  const entries = []
  let i = 0

  while (i < lines.length) {
    const trimmed = lines[i].trim()
    i += 1
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()

    const opensDouble = val.startsWith('"')
    const opensSingle = val.startsWith("'")
    const quote = opensDouble ? '"' : opensSingle ? "'" : null

    if (quote && !val.endsWith(quote)) {
      let buf = val.slice(1)
      while (i < lines.length) {
        const next = lines[i]
        i += 1
        const nextTrim = next.trimEnd()
        if (nextTrim.endsWith(quote)) {
          buf += `\n${nextTrim.slice(0, -1)}`
          break
        }
        buf += `\n${next}`
      }
      val = buf
    } else if (quote && val.endsWith(quote)) {
      val = val.slice(1, -1)
    }

    val = val.replace(/\\n/g, '\n')
    entries.push([key, val])
  }

  return entries
}

export function loadEnvLocal() {
  const envPath = join(root, '.env.local')
  if (!existsSync(envPath)) return false

  for (const [key, val] of parseEnvLocalContent(readFileSync(envPath, 'utf8'))) {
    if (!process.env[key]) process.env[key] = val
  }
  return true
}

/** Call at script entry when run directly. */
export function loadEnvLocalOrExit() {
  const loaded = loadEnvLocal()
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('❌ DATABASE_URL not set — copy .env.local.example → .env.local')
    process.exit(1)
  }
  return loaded
}
