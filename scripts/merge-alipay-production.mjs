#!/usr/bin/env node
/**
 * Merge ALIPAY_* from .env.local → .env.production (for aliyun:sync --with-env).
 * Default: ALIPAY_SANDBOX=true. Pass --live when using 正式商户密钥.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const live = process.argv.includes('--live')
const localPath = join(root, '.env.local')
const prodPath = join(root, '.env.production')

if (!existsSync(localPath)) {
  console.error('❌ 缺少 .env.local（需 ALIPAY_APP_ID / 私钥 / 公钥）')
  process.exit(1)
}
if (!existsSync(prodPath)) {
  console.error('❌ 缺少 .env.production')
  process.exit(1)
}

const local = Object.fromEntries(parseEnvLocalContent(readFileSync(localPath, 'utf8')))
const appId = local.ALIPAY_APP_ID?.trim()
const privateKey = local.ALIPAY_PRIVATE_KEY?.trim()
const publicKey = local.ALIPAY_PUBLIC_KEY?.trim()

if (!appId || !privateKey || !publicKey) {
  console.error('❌ .env.local 缺少 ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY')
  process.exit(1)
}

const lines = readFileSync(prodPath, 'utf8').split(/\r?\n/)
const drop = new Set([
  'ALIPAY_SANDBOX',
  'ALIPAY_APP_ID',
  'ALIPAY_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY',
  'ALIPAY_GATEWAY',
  'PAYMENT_NOTIFY_URL',
])
const out = lines.filter((line) => {
  const t = line.trim()
  if (!t || t.startsWith('#')) return true
  const eq = t.indexOf('=')
  if (eq === -1) return true
  return !drop.has(t.slice(0, eq).trim())
})

const mode = live ? '正式' : '沙箱'
out.push(
  '',
  `# 支付宝 ${mode}（notify 自动用 APP_URL；正式收款: node scripts/merge-alipay-production.mjs --live）`,
)
if (!live) out.push('ALIPAY_SANDBOX=true')
out.push(`ALIPAY_APP_ID="${appId}"`)
out.push(`ALIPAY_PRIVATE_KEY="${privateKey.replace(/"/g, '\\"')}"`)
out.push(`ALIPAY_PUBLIC_KEY="${publicKey.replace(/"/g, '\\"')}"`)

writeFileSync(prodPath, out.join('\n').replace(/\n?$/, '\n'), 'utf8')
console.log(`✅ 已写入 ${prodPath}（${mode}）`)
console.log('   下一步: npm run aliyun:sync -- --with-env && npm run aliyun:remote-install')
