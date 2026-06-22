#!/usr/bin/env node
/**
 * 阿里云 P0 预检 — 文档、模板、.env.production、支付回调、可选线上 smoke
 *
 *   node scripts/aliyun-p0-preflight.mjs
 *   node scripts/aliyun-p0-preflight.mjs --env
 *   node scripts/aliyun-p0-preflight.mjs --env --url https://你的域名
 */
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const checkEnv = process.argv.includes('--env')
const urlIdx = process.argv.indexOf('--url')
const remoteUrl = urlIdx >= 0 ? process.argv[urlIdx + 1]?.replace(/\/$/, '') : ''

const requiredDocs = [
  'docs/CN_LAUNCH_P0.md',
  'docs/DEPLOY_ALIYUN_CN.md',
  'docs/ENV_PRODUCTION.md',
  'docs/OBSERVABILITY.md',
  'docs/PLAN_SYSTEM_QUICKSTART.md',
  'docs/RELEASE_RUNBOOK.md',
]

const deployAssets = [
  'deploy/aliyun/env.production.example',
  'deploy/aliyun/nginx.conf.example',
  'deploy/aliyun/ecosystem.config.cjs',
  'deploy/aliyun/crontab.example',
  'deploy/aliyun/healthcheck.cron.example',
]

console.log('=== AI IDE 阿里云 P0 预检 ===\n')

let failed = 0

console.log('--- 文档 ---')
for (const rel of requiredDocs) {
  const ok = existsSync(join(root, rel))
  console.log(`  ${ok ? '✅' : '❌'} ${rel}`)
  if (!ok) failed++
}

console.log('\n--- deploy/aliyun 模板 ---')
for (const rel of deployAssets) {
  const ok = existsSync(join(root, rel))
  console.log(`  ${ok ? '✅' : '❌'} ${rel}`)
  if (!ok) failed++
}

console.log('\n--- .env.production.example（前端 Flag）---')
const viteExample = join(root, '.env.production.example')
if (existsSync(viteExample)) {
  const viteRaw = readFileSync(viteExample, 'utf8')
  const viteFlags = [
    'VITE_AIDE_SPEC_ARTIFACTS_V2=true',
    'VITE_AIDE_RUNTIME=true',
    'VITE_AIDE_ACTIVITY_LINE=true',
    'VITE_GA_LIVE=true',
    'VITE_TAB_PLUS_PLUS=true',
  ]
  for (const flag of viteFlags) {
    const ok = viteRaw.includes(flag)
    console.log(`  ${ok ? '✅' : '❌'} ${flag}`)
    if (!ok) failed++
  }
} else {
  console.log('  ❌ .env.production.example 缺失')
  failed++
}

if (checkEnv) {
  console.log('\n--- .env.production（API / 构建）---')
  const envPath = join(root, '.env.production')
  if (!existsSync(envPath)) {
    console.log('  ❌ 未找到 .env.production')
    console.log('  → cp deploy/aliyun/env.production.example .env.production')
    failed++
  } else {
    const env = Object.fromEntries(parseEnvLocalContent(readFileSync(envPath, 'utf8')))
    for (const key of ['DATABASE_URL', 'AUTH_SECRET']) {
      const ok = Boolean(env[key]?.trim())
      console.log(`  ${ok ? '✅' : '❌'} ${key}`)
      if (!ok) failed++
    }
    const appUrl = env.APP_URL?.trim() || ''
    if (!appUrl || appUrl.includes('example.com')) {
      console.log('  ⚠️  APP_URL — 备案通过后改为 https://正式域名')
    } else if (!appUrl.startsWith('https://')) {
      console.log(`  ⚠️  APP_URL 应使用 https: ${appUrl}`)
    } else {
      console.log(`  ✅ APP_URL ${appUrl}`)
      console.log('\n--- 支付回调 URL（填入商户控制台）---')
      console.log(`  支付宝 notify: ${appUrl}/api/payment/alipay/notify`)
      console.log(`  微信 notify:   ${appUrl}/api/payment/wechat/notify`)
    }
    if (env.PUBLIC_WELFARE_MODE?.trim().toLowerCase() === 'true') {
      console.log('  ⚠️  PUBLIC_WELFARE_MODE=true — 国内收费应设为 false')
    } else {
      console.log('  ✅ PUBLIC_WELFARE_MODE 未开启福利模式')
    }
    const cron = env.CRON_SECRET?.trim() || env.BILLING_CRON_SECRET?.trim()
    console.log(cron ? '  ✅ CRON_SECRET 已设置' : '  ⚠️  CRON_SECRET — 阿里云 Cron 必填')
    const alipay = env.ALIPAY_APP_ID?.trim()
    console.log(alipay ? '  ✅ ALIPAY_APP_ID 已设置' : '  ⚠️  ALIPAY_APP_ID — 收费上线前必填')
  }
}

if (remoteUrl) {
  console.log(`\n--- 线上 smoke @ ${remoteUrl} ---`)
  const r = spawnSync('node', ['scripts/smoke-production.mjs', remoteUrl], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (r.status !== 0) failed++
}

console.log(failed === 0 ? '\n✅ P0 预检通过' : `\n❌ P0 预检 ${failed} 项未通过 — 见 docs/CN_LAUNCH_P0.md`)
process.exit(failed > 0 ? 1 : 0)
