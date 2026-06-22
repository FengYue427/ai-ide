#!/usr/bin/env node
/**
 * 一键：构建 → 同步 → 远程安装 → smoke（需 .env.aliyun + 服务器 .env.production）
 *
 *   npm run aliyun:deploy
 *   npm run aliyun:deploy -- --with-env
 *   npm run aliyun:deploy -- --skip-smoke
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadEnvAliyun } from './load-env-aliyun.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const withEnv = args.includes('--with-env')
const skipSmoke = args.includes('--skip-smoke')

function run(npmScript, extra = []) {
  const r = spawnSync('npm', ['run', npmScript, '--', ...extra], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('=== AI IDE 阿里云一键部署 ===\n')

run('aliyun:build')
run('aliyun:sync', withEnv ? ['--with-env'] : [])
run('aliyun:remote-install')

loadEnvAliyun()
const appUrl = process.env.APP_URL?.trim().replace(/\/$/, '')

function isIpAppUrl(url) {
  try {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(new URL(url).hostname)
  } catch {
    return false
  }
}

if (!skipSmoke && appUrl && isIpAppUrl(appUrl)) {
  console.log('\n⚠️  APP_URL 为 IP 地址 — 跳过 smoke（备案域名 + HTTPS 后再跑）')
  console.log('   npm run smoke:production -- https://你的域名')
} else if (!skipSmoke && appUrl && !appUrl.includes('your-domain') && !appUrl.includes('example.com')) {
  console.log(`\n=== Smoke @ ${appUrl} ===\n`)
  run('smoke:production', [appUrl])
  run('aliyun:p0', ['--env', '--url', appUrl])
} else if (!skipSmoke) {
  console.log('\n⚠️  APP_URL 未配置有效域名 — 跳过 smoke')
  console.log('   备案通过后: npm run smoke:production -- https://你的域名')
}

console.log('\n✅ 阿里云部署流程完成')
