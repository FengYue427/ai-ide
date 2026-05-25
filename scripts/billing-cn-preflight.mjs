/**
 * Check Alipay / WeChat env without calling payment APIs.
 * Usage: node scripts/billing-cn-preflight.mjs
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

if (existsSync(envPath)) {
  for (const [key, value] of parseEnvLocalContent(readFileSync(envPath, 'utf8'))) {
    if (!process.env[key]) process.env[key] = value
  }
}

function tryNormalizePem(raw, pemType) {
  const text = raw.replace(/\\n/g, '\n').trim()
  if (!text) return { ok: false, error: '密钥为空' }
  const body = text
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  if (!body || body.length < 32) {
    return {
      ok: false,
      error: '内容过短（.env 多行无引号时可能只读到第一行；用 *_PATH 或 \\n 单行）',
    }
  }
  return { ok: true }
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

const alipayOk =
  has('ALIPAY_APP_ID') && hasKey('ALIPAY_PRIVATE_KEY', 'ALIPAY_PRIVATE_KEY_PATH') && hasKey('ALIPAY_PUBLIC_KEY', 'ALIPAY_PUBLIC_KEY_PATH')

if (has('PAYMENT_NOTIFY_URL')) {
  console.log(`✅ PAYMENT_NOTIFY_URL=${process.env.PAYMENT_NOTIFY_URL}`)
} else {
  const sandbox = process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1'
  const appUrl = process.env.APP_URL?.trim() || ''
  const localApp = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(appUrl)
  if (sandbox && localApp && alipayOk) {
    console.log(
      '❌ 沙箱下单: 须设置 PAYMENT_NOTIFY_URL=https://ngrok域名（localhost 作 notify 会跳转 /error）',
    )
    issues++
  } else {
    console.log('⚠️  PAYMENT_NOTIFY_URL 未设置 — 本地支付宝/微信异步通知需 ngrok 等 HTTPS 隧道')
  }
}

if (alipayOk) {
  const sandbox = process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1'
  const gateway =
    process.env.ALIPAY_GATEWAY?.trim() ||
    (sandbox ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do')
  let pemWarn = ''
  try {
    const priv = has('ALIPAY_PRIVATE_KEY')
      ? process.env.ALIPAY_PRIVATE_KEY
      : readFileSync(process.env.ALIPAY_PRIVATE_KEY_PATH.trim(), 'utf8')
    const pub = has('ALIPAY_PUBLIC_KEY')
      ? process.env.ALIPAY_PUBLIC_KEY
      : readFileSync(process.env.ALIPAY_PUBLIC_KEY_PATH.trim(), 'utf8')
    const p = tryNormalizePem(priv, 'RSA PRIVATE KEY')
    const u = tryNormalizePem(pub, 'PUBLIC KEY')
    if (!p.ok) pemWarn = ` 私钥: ${p.error}`
    else if (!u.ok) pemWarn = ` 支付宝公钥: ${u.error}`
  } catch (e) {
    pemWarn = ` ${e.message}`
  }
  console.log(
    `✅ 支付宝已配置 (${sandbox ? '沙箱' : '正式'}) gateway=${gateway}${pemWarn ? `\n   ⚠️ PEM 可能无效:${pemWarn}` : ''}`,
  )
  if (pemWarn) issues++
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
