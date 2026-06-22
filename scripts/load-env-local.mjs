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

export function loadEnvFromFile(envPath, { onlyIfUnset = true } = {}) {
  if (!existsSync(envPath)) return false

  for (const [key, val] of parseEnvLocalContent(readFileSync(envPath, 'utf8'))) {
    if (!onlyIfUnset && process.env[key] !== undefined) {
      delete process.env[key]
    }
    if (!onlyIfUnset || !process.env[key]) process.env[key] = val
  }
  return true
}

export function loadEnvLocal() {
  return loadEnvFromFile(join(root, '.env.local'))
}

/** Production on Aliyun ECS — reads `.env.production` or AI_IDE_ENV_FILE. */
export function loadProductionEnv() {
  const custom = process.env.AI_IDE_ENV_FILE?.trim()
  if (custom) return loadEnvFromFile(custom)
  return loadEnvFromFile(join(root, '.env.production'))
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

/** migrate deploy: .env.local → .env.production → .env.aliyun TARGET_* */
export function loadEnvForDbOrExit() {
  loadEnvLocal()
  if (!process.env.DATABASE_URL?.trim()) {
    loadProductionEnv()
  }
  if (!process.env.DATABASE_URL?.trim()) {
    const aliyunPath = join(root, '.env.aliyun')
    if (existsSync(aliyunPath)) {
      loadEnvFromFile(aliyunPath)
      const target =
        process.env.TARGET_DATABASE_URL?.trim() || process.env.RDS_DATABASE_URL?.trim()
      if (target && !process.env.DATABASE_URL?.trim()) {
        process.env.DATABASE_URL = target
      }
    }
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      '❌ DATABASE_URL not set — .env.local / .env.production / .env.aliyun TARGET_DATABASE_URL',
    )
    process.exit(1)
  }
}
