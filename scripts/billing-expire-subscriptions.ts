/**
 * Downgrade subscriptions past period end + grace (3 days).
 * Usage: BILLING_CRON_SECRET=xxx npm run billing:expire
 */
import { loadEnvLocal } from './load-env-local.mjs'
import { processExpiredSubscriptions } from '../lib/billing/subscriptionExpiry'

loadEnvLocal()

const result = await processExpiredSubscriptions()
console.log('[billing:expire]', result)
