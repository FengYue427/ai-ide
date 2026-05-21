/**
 * Load .env.local into process.env (does not override existing vars).
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function loadEnvLocal() {
  const envPath = join(root, '.env.local')
  if (!existsSync(envPath)) return false

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
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
