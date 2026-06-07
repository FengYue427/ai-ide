/**
 * Check Alipay / WeChat env without calling payment APIs.
 * Usage: node scripts/billing-cn-preflight.mjs
 *        node scripts/billing-cn-preflight.mjs --production
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseEnvLocalContent } from './load-env-local.mjs'

const productionMode = process.argv.includes('--production')
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

console.log(`=== CN payment preflight${productionMode ? ' (production)' : ''} ===\n`)

console.log('定价（lib/billing/plans.ts）: 免费 / 专业版 ¥39 / 团队版 ¥79')
console.log('配额: 免费 200 加权单位/日 · 经济模型 | 专业 2000 | 团队 不限\n')

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
  const gatewayIsSandbox = gateway.includes('sandbox') || gateway.includes('alipaydev')
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

  if (productionMode) {
    if (sandbox) {
      console.log('❌ 生产模式: 请删除 ALIPAY_SANDBOX（或设为 false）')
      issues++
    }
    if (gatewayIsSandbox) {
      console.log('❌ 生产模式: ALIPAY_GATEWAY 不能指向沙箱域名')
      issues++
    }
    const appUrl = process.env.APP_URL?.trim() || ''
    if (!/^https:\/\//i.test(appUrl) || /localhost|127\.0\.0\.1/i.test(appUrl)) {
      console.log('❌ 生产模式: APP_URL 须为 https 生产域名（如 https://ai-ide-flame.vercel.app）')
      issues++
    } else {
      console.log(`✅ 生产 notify/return 基址: ${appUrl.replace(/\/$/, '')}`)
      console.log(`   支付宝开放平台异步通知: ${appUrl.replace(/\/$/, '')}/api/payment/alipay/notify`)
    }
    if (has('PAYMENT_NOTIFY_URL')) {
      console.log(
        '⚠️  生产 Vercel 建议删除 PAYMENT_NOTIFY_URL（留空则自动用 APP_URL；仅本地 ngrok 需要）',
      )
    }
    if (process.env.ALLOW_DEV_BILLING === 'true') {
      console.log('❌ 生产模式: ALLOW_DEV_BILLING 必须未设置')
      issues++
    }
    const appId = process.env.ALIPAY_APP_ID?.trim() || ''
    if (/^9021000/i.test(appId)) {
      console.log('⚠️  ALIPAY_APP_ID 以 9021000 开头 — 常见为沙箱 AppID，请确认已换生产 AppID')
    }
  }
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
console.log('\n文档: docs/CN_PAYMENT_SETUP.md · docs/CN_MERCHANT_APPLY_CHECKLIST.md')
console.log('校验: npm run verify:alipay:prices -- --production\n')

if (productionMode && alipayOk && issues === 0) {
  console.log('✅ 生产支付宝 env 检查通过 — 请在 Vercel Redeploy 后实付 ¥39 验收升级\n')
}

process.exit(issues > 0 ? 1 : 0)
