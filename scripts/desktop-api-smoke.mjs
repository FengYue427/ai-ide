/**
 * Smoke checks for desktop cross-origin API wiring (no Electron runtime required).
 * Run: node scripts/desktop-api-smoke.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const offenders = ["fetch('/api/", 'fetch(`/api/', 'fetch("/api/']

const filesToScan = [
  'src/components/SubscriptionModal.tsx',
  'src/services/platformAiService.ts',
  'src/services/remoteWorkspaceService.ts',
  'src/hooks/useCloudHealth.ts',
  'src/components/AuthModal.tsx',
]

for (const rel of filesToScan) {
  const content = readFileSync(join(root, rel), 'utf8')
  for (const pattern of offenders) {
    assert.equal(
      content.includes(pattern),
      false,
      `${rel} still contains bare ${pattern} — use apiFetch instead`,
    )
  }
}

const apiUtils = readFileSync(join(root, 'src', 'services', 'apiUtils.ts'), 'utf8')
assert.match(apiUtils, /buildApiUrl/, 'apiUtils must export buildApiUrl')
assert.match(apiUtils, /getStoredAuthToken/, 'apiUtils must inject bearer token for desktop')

console.log('✅ desktop-api-smoke: no bare /api fetch in critical paths')
