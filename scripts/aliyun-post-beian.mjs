#!/usr/bin/env node
/**
 * 备案通过后：更新 APP_URL / ICP 前端变量 / Nginx / Cron，可选同步部署
 *
 *   npm run aliyun:post-beian -- --domain 许红花.com --icp 鲁ICP备xxxxxxxx号
 *   npm run aliyun:post-beian -- --domain 许红花.com --icp 鲁ICP备xxxxxxxx号 --apply
 *
 * --apply：aliyun:build → sync --with-env → 上传 nginx → 更新服务器 cron → pm2 restart
 * 备案通过前请勿 --apply（需先 DNS A 记录 + 可选 SSL）
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { domainToASCII } from 'node:url'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvAliyun, loadEnvAliyunOrExit } from './load-env-aliyun.mjs'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const domainArg = args.find((a) => a.startsWith('--domain='))?.slice('--domain='.length)
const icpArg = args.find((a) => a.startsWith('--icp='))?.slice('--icp='.length)

loadEnvAliyun()
const domain =
  domainArg?.trim() ||
  process.env.BEIAN_DOMAIN?.trim()

if (!domain) {
  console.error('❌ 请指定 --domain=许红花.com 或在 .env.aliyun 设置 BEIAN_DOMAIN')
  process.exit(1)
}

const asciiDomain = domainToASCII(domain)
const appUrl = `https://${domain.replace(/^https?:\/\//, '')}`
const prodPath = join(root, '.env.production')
const aliyunPath = join(root, '.env.aliyun')

function upsertEnvFile(filePath, updates) {
  if (!existsSync(filePath)) {
    console.error(`❌ 缺少 ${filePath}`)
    process.exit(1)
  }
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  const keys = new Set(Object.keys(updates))
  const out = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      out.push(line)
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      out.push(line)
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    if (keys.has(key)) {
      const val = updates[key]
      out.push(`${key}="${val}"`)
      keys.delete(key)
    } else {
      out.push(line)
    }
  }
  for (const key of keys) {
    out.push(`${key}="${updates[key]}"`)
  }
  writeFileSync(filePath, out.join('\n').replace(/\n?$/, '\n'), 'utf8')
}

console.log('=== AI IDE 备案通过后配置 ===\n')
console.log(`  域名: ${domain}`)
if (asciiDomain !== domain) console.log(`  Punycode: ${asciiDomain}`)
console.log(`  APP_URL（--apply 时写入）: ${appUrl}`)
if (icpArg) console.log(`  ICP: ${icpArg}`)

const prodUpdates = {
  APP_URL: appUrl,
  AUTH_URL: appUrl,
}
if (icpArg) prodUpdates.VITE_ICP_BEIAN = icpArg

// Nginx — server_name 含中文 + punycode
const deployPath = process.env.ALIYUN_DEPLOY_PATH?.trim() || '/opt/ai-ide'
const template = readFileSync(join(root, 'deploy/aliyun/nginx.conf.example'), 'utf8')
const serverNames = asciiDomain !== domain ? `${domain} ${asciiDomain}` : domain
const nginxOut = join(root, 'deploy/aliyun/nginx.generated.conf')
const rendered = template
  .replace(/YOUR_DOMAIN/g, serverNames)
  .replace(/www\.YOUR_DOMAIN/g, `www.${asciiDomain}`)
  .replace(/\/opt\/ai-ide/g, deployPath)

writeFileSync(nginxOut, rendered, 'utf8')
console.log(`\n✅ 已写入 ${nginxOut}`)

console.log(`
--- 备案通过后手动步骤 ---
1. 域名解析: ${domain}  A  →  47.105.110.136  （www 可选 CNAME）
2. 轻量控制台申请免费 SSL，或 certbot
3. SSL 证书放到 /etc/nginx/ssl/ 后取消 nginx 模板中 443 server 注释
4. 运行: npm run aliyun:post-beian -- --domain=${domain}${icpArg ? ` --icp=${icpArg}` : ''} --apply
`)

if (!apply) {
  console.log('ℹ️  未传 --apply — 仅生成 nginx.generated.conf，未改 .env（当前仍用 IP 内测）')
  process.exit(0)
}

upsertEnvFile(prodPath, prodUpdates)

if (existsSync(aliyunPath)) {
  const aliyunLines = readFileSync(aliyunPath, 'utf8').split(/\r?\n/)
  const out = []
  let hasApp = false
  let hasBeian = false
  for (const line of aliyunLines) {
    if (line.startsWith('APP_URL=')) {
      out.push(`APP_URL=${appUrl}`)
      hasApp = true
    } else if (line.startsWith('BEIAN_DOMAIN=')) {
      out.push(`BEIAN_DOMAIN=${domain}`)
      hasBeian = true
    } else {
      out.push(line)
    }
  }
  if (!hasApp) out.push(`APP_URL=${appUrl}`)
  if (!hasBeian) out.push(`BEIAN_DOMAIN=${domain}`)
  writeFileSync(aliyunPath, out.join('\n').replace(/\n?$/, '\n'), 'utf8')
}

loadEnvAliyunOrExit()

function run(npmScript, extra = []) {
  const r = spawnSync('npm', ['run', npmScript, '--', ...extra], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('\n=== 部署到服务器 ===\n')
run('aliyun:build')
run('aliyun:sync', ['--with-env'])
run('aliyun:remote-install')

const ssh = process.env.ALIYUN_SSH.trim()
const cronSecret = parseEnvLocalContent(readFileSync(prodPath, 'utf8')).find(
  ([k]) => k === 'CRON_SECRET',
)?.[1]

if (cronSecret) {
  const cronBody = `SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

0 3 * * * root curl -fsS -X POST -H "Authorization: Bearer ${cronSecret}" "${appUrl}/api/billing/expire-subscriptions" >> /var/log/ai-ide-cron.log 2>&1
0 4 * * * root curl -fsS -X POST -H "Authorization: Bearer ${cronSecret}" "${appUrl}/api/jobs/process" >> /var/log/ai-ide-cron.log 2>&1
5 * * * * root curl -fsS --max-time 15 "${appUrl}/api/health" | grep -q '"status":"ok"' || echo "$(date -Is) health FAIL" >> /var/log/ai-ide-health.log
`
  writeFileSync(join(root, 'deploy/aliyun/cron.generated'), cronBody, 'utf8')
  spawnSync('scp', [nginxOut, `${ssh}:/etc/nginx/conf.d/ai-ide.conf`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  spawnSync('scp', [join(root, 'deploy/aliyun/cron.generated'), `${ssh}:/etc/cron.d/ai-ide`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  spawnSync(
    'ssh',
    [
      ssh,
      'nginx -t && systemctl reload nginx && chmod 644 /etc/cron.d/ai-ide && pm2 restart ai-ide-api',
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  )
}

console.log(`\n✅ 完成 — 打开 ${appUrl}/api/health 验收`)
