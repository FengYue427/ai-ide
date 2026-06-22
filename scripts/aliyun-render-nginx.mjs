#!/usr/bin/env node
/**
 * 根据 APP_URL 渲染 Nginx 配置
 *
 *   APP_URL=https://your-domain.com node scripts/aliyun-render-nginx.mjs
 *   npm run aliyun:nginx -- --write deploy/aliyun/nginx.generated.conf
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadEnvAliyun } from './load-env-aliyun.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const writeIdx = process.argv.indexOf('--write')
const outPath =
  writeIdx >= 0 ? process.argv[writeIdx + 1] : join(root, 'deploy/aliyun/nginx.generated.conf')

loadEnvAliyun()

const appUrl = process.env.APP_URL?.trim() || ''
let domain = process.argv.find((a) => a.startsWith('--domain='))?.slice('--domain='.length)
if (!domain && appUrl) {
  try {
    domain = new URL(appUrl).hostname
  } catch {
    // ignore
  }
}

if (!domain || domain.includes('example.com') || domain.includes('your-domain')) {
  console.error('❌ 请设置 APP_URL 或 --domain=your-domain.com')
  process.exit(1)
}

const deployPath = process.env.ALIYUN_DEPLOY_PATH?.trim() || '/opt/ai-ide'
const template = readFileSync(join(root, 'deploy/aliyun/nginx.conf.example'), 'utf8')
const rendered = template
  .replace(/YOUR_DOMAIN/g, domain)
  .replace(/\/opt\/ai-ide/g, deployPath)

writeFileSync(outPath, rendered, 'utf8')
console.log(`✅ Nginx 配置已写入 ${outPath}`)
console.log(`   server_name: ${domain}`)
console.log(`   root: ${deployPath}/dist`)
console.log('   服务器: sudo cp deploy/aliyun/nginx.generated.conf /etc/nginx/conf.d/ai-ide.conf && sudo nginx -t && sudo systemctl reload nginx')
