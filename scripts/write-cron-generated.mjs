#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const prodPath = join(root, '.env.production')
const env = Object.fromEntries(parseEnvLocalContent(readFileSync(prodPath, 'utf8')))
const cron = env.CRON_SECRET?.trim()
const appUrl = (env.APP_URL || 'https://许红花.com').replace(/\/$/, '')
if (!cron) {
  console.error('❌ CRON_SECRET missing in .env.production')
  process.exit(1)
}
const body = `SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

0 3 * * * root curl -fsS -X POST -H "Authorization: Bearer ${cron}" "${appUrl}/api/billing/expire-subscriptions" >> /var/log/ai-ide-cron.log 2>&1
0 4 * * * root curl -fsS -X POST -H "Authorization: Bearer ${cron}" "${appUrl}/api/jobs/process" >> /var/log/ai-ide-cron.log 2>&1
5 * * * * root curl -fsS --max-time 15 -k "https://127.0.0.1/api/health" | grep -q '"status":"ok"' || echo "$(date -Is) health FAIL" >> /var/log/ai-ide-health.log
`
writeFileSync(join(root, 'deploy/aliyun/cron.generated'), body, 'utf8')
console.log('✅ deploy/aliyun/cron.generated')
