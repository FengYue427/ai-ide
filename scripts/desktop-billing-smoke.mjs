/**
 * Validates desktop Electron env for live billing (same as web: Pro ¥39 · Team ¥79).
 * Run: npm run smoke:desktop-billing
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const electronEnvPath = join(root, '.env.electron')
const plansPath = join(root, 'lib/billing/plans.ts')

assert.ok(existsSync(electronEnvPath), '.env.electron must exist for desktop builds')

const envText = readFileSync(electronEnvPath, 'utf8')
assert.match(
  envText,
  /VITE_PUBLIC_WELFARE\s*=\s*false/i,
  '.env.electron must set VITE_PUBLIC_WELFARE=false (desktop charges like web)',
)
assert.match(
  envText,
  /VITE_API_BASE_URL\s*=\s*https?:\/\//i,
  'VITE_API_BASE_URL must point to a deployed API',
)

const plans = readFileSync(plansPath, 'utf8')
assert.match(plans, /priceCny:\s*39/, 'Pro plan must be ¥39 in lib/billing/plans.ts')
assert.match(plans, /priceCny:\s*79/, 'Team plan must be ¥79 in lib/billing/plans.ts')

const subscriptionModal = readFileSync(join(root, 'src/components/SubscriptionModal.tsx'), 'utf8')
assert.match(subscriptionModal, /appendDesktopCheckoutFields/, 'SubscriptionModal must pass desktopShell on checkout')

console.log('✅ desktop-billing-smoke: .env.electron billing enabled (Pro ¥39 · Team ¥79)')
console.log('   Rebuild: npm run build:electron && npm run electron:pack:offline')
