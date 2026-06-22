import { ensurePlansSeeded } from '../lib/billing/subscriptionDb'
import { loadEnvLocal, loadProductionEnv } from './load-env-local.mjs'

loadEnvLocal()
if (!process.env.DATABASE_URL?.trim()) {
  loadProductionEnv()
}

await ensurePlansSeeded()
console.log('✅ Plans seeded')
