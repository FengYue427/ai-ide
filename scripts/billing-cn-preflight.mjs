/**
 * Check Alipay / WeChat env without calling payment APIs.
 * Usage: node scripts/billing-cn-preflight.mjs
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function has(v) {
  return Boolean(process.env[v]?.trim())
}

function hasKey(name, pathName) {
  return has(name) || (has(pathName) && existsSync(process.env[pathName].trim()))
}

let issues = 0

console.log('=== CN payment preflight ===\n')

console.log('定价（代码内置）: 免费 / 专业版 ¥19 / 团队版 ¥49')
console.log('配额: 免费 200次/日·10工作区 | 专业 5000次/日 | 团队 不限\n')

if (has('APP_URL')) console.log(`✅ APP_URL=${process.env.APP_URL}`)
else {
  console.log('⚠️  APP_URL 未设置（将用请求 Host，本地建议 http://localhost:3000）')
}

if (has('PAYMENT_NOTIFY_URL')) {
  console.log(`✅ PAYMENT_NOTIFY_URL=${process.env.PAYMENT_NOTIFY_URL}`)
} else {
  console.log('⚠️  PAYMENT_NOTIFY_URL 未设置 — 本地支付宝/微信异步通知需 ngrok 等 HTTPS 隧道')
}

const alipayOk =
  has('ALIPAY_APP_ID') && hasKey('ALIPAY_PRIVATE_KEY', 'ALIPAY_PRIVATE_KEY_PATH') && hasKey('ALIPAY_PUBLIC_KEY', 'ALIPAY_PUBLIC_KEY_PATH')

if (alipayOk) {
  const sandbox = process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1'
  const gateway =
    process.env.ALIPAY_GATEWAY?.trim() ||
    (sandbox ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do')
  console.log(`✅ 支付宝已配置 (${sandbox ? '沙箱' : '正式'}) gateway=${gateway}`)
} else {
  console.log('❌ 支付宝未齐: 需要 ALIPAY_APP_ID + 应用私钥 + 支付宝公钥')
  issues++
}

const wechatOk =
  has('WECHAT_APP_ID') &&
  has('WECHAT_MCH_ID') &&
  has('WECHAT_API_V3_KEY') &&
  has('WECHAT_SERIAL_NO') &&
  hasKey('WECHAT_PRIVATE_KEY', 'WECHAT_PRIVATE_KEY_PATH') &&
  hasKey('WECHAT_PLATFORM_PUBLIC_KEY', 'WECHAT_PLATFORM_PUBLIC_KEY_PATH')

if (wechatOk) {
  console.log('✅ 微信支付已配置（含平台证书公钥）')
} else {
  console.log('❌ 微信未齐: WECHAT_APP_ID/MCH_ID/API_V3_KEY/SERIAL_NO/商户私钥/平台证书公钥')
  issues++
}

console.log('\n下一步:')
console.log('  npm run dev:stack')
console.log('  curl http://127.0.0.1:3001/api/subscription/payment-methods')
console.log('  登录 → 订阅 → 支付宝或微信')
console.log('\n文档: docs/CN_PAYMENT_SETUP.md\n')

process.exit(issues > 0 && !alipayOk && !wechatOk ? 1 : 0)
