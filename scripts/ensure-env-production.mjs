/**
 * Create .env.production from .env.production.example when missing (local/CI builds).
 * .env.production must not be tracked — see scripts/security-baseline.mjs
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, '.env.production')
const example = join(root, '.env.production.example')

if (!existsSync(target) && existsSync(example)) {
  copyFileSync(example, target)
  console.log('[ensure-env-production] created .env.production from .env.production.example')
}
