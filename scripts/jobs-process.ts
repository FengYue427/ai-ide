/**
 * Process queued background jobs locally (same logic as Vercel cron).
 *
 * Usage:
 *   npm run jobs:process
 */
import { loadEnvLocal } from './load-env-local.mjs'
import { processBackgroundJobs } from '../lib/api/backgroundJobProcessor'

loadEnvLocal()

const result = await processBackgroundJobs({ limit: 5 })
console.log('[jobs:process]', result)
