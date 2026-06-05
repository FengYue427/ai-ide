/**
 * Seed a pending plugin publish review into localStorage (dev / E2E harness).
 *
 * Usage:
 *   node scripts/seed-plugin-review.mjs
 *
 * Prints JSON to paste in browser console:
 *   localStorage.setItem('ai-ide:plugin-publish-reviews', '<json>')
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const samplePath = join(root, 'fixtures/plugins/community-sample/community-sample.plugin.json')
const raw = readFileSync(samplePath, 'utf8')
const pkg = JSON.parse(raw)
const manifestHash = createHash('sha256').update(JSON.stringify(pkg.manifest)).digest('hex').slice(0, 16)

const item = {
  reviewId: 'rev_e2e_community_sample',
  status: 'pending',
  pluginId: pkg.manifest.id,
  version: pkg.manifest.version,
  manifestHash,
  submittedAt: new Date().toISOString(),
}

const payload = JSON.stringify([item])
console.log('=== Plugin review seed (localStorage) ===\n')
console.log(`localStorage.setItem('ai-ide:plugin-publish-reviews', ${JSON.stringify(payload)});\n`)
console.log('Item:', item)
