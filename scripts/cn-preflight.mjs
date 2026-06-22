#!/usr/bin/env node
/**
 * 阿里云备案 & 国内部署 — 本地前置检查（无需已购服务器）
 *
 *   node scripts/cn-preflight.mjs
 *   node scripts/cn-preflight.mjs --env   # 同时检查 .env.production
 */
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { parseEnvLocalContent } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const checkEnv = process.argv.includes('--env')

const checklist = [
  {
    id: 'account',
    title: '阿里云账号已完成个人/企业实名认证',
    link: 'https://account.aliyun.com/',
  },
  {
    id: 'domain',
    title: '已注册域名（建议 .com），并完成域名实名认证',
    detail: '域名持有人必须与 ICP 备案主体一致；距到期日 >45 天',
    link: 'https://dc.console.aliyun.com/',
  },
  {
    id: 'ecs',
    title: '已购买中国内地节点 ECS 或轻量应用服务器',
    detail: '推荐：轻量 2核4G Ubuntu 22.04，地域选与你备案省份一致（如华东、华北）',
    link: 'https://swas.console.aliyun.com/',
  },
  {
    id: 'rds',
    title: '已购买阿里云 RDS PostgreSQL（与 ECS 同地域）',
    detail: '规格：pg.n2.small.1 或更高；白名单仅放行 ECS 安全组',
    link: 'https://rdsnext.console.aliyun.com/',
  },
  {
    id: 'service-code',
    title: '已在 ECS/轻量控制台申请「备案服务号」',
    detail: '每台大陆实例通常 5 个服务号；备案订单需绑定',
    link: 'https://beian.aliyun.com/',
  },
  {
    id: 'dns-hold',
    title: '备案提交前：域名尚未解析到大陆服务器公网 IP',
    detail: '未备案解析会被阻断；内测可用 ECS IP + /etc/hosts',
  },
  {
    id: 'subject',
    title: '已确认 ICP 备案主体（个人/个体户/监护人）',
    detail: '未满 16 岁多数省份不可个人备案；完整 IDE+注册+支付建议个体户主体',
  },
  {
    id: 'ssl-later',
    title: 'SSL 证书（备案通过后）',
    detail: '阿里云免费 DV 证书或 Let\'s Encrypt；APP_URL 必须是 https 域名',
  },
]

console.log('=== AI IDE 阿里云备案前置清单 ===\n')
console.log('请在阿里云控制台逐项完成；完成后在本机部署时使用 deploy/aliyun/ 模板。\n')

checklist.forEach((item, index) => {
  console.log(`${index + 1}. [ ] ${item.title}`)
  if (item.detail) console.log(`       ${item.detail}`)
  if (item.link) console.log(`       → ${item.link}`)
  console.log('')
})

console.log('--- 仓库内资源 ---')
const assets = [
  ['deploy/aliyun/env.production.example', '生产环境变量模板'],
  ['deploy/aliyun/nginx.conf.example', 'Nginx 静态 + /api 反代 + COOP/COEP'],
  ['deploy/aliyun/ecosystem.config.cjs', 'PM2 常驻 API'],
  ['deploy/aliyun/crontab.example', '定时任务（订阅过期、后台 Job）'],
  ['deploy/aliyun/healthcheck.cron.example', '可选：每小时 /api/health 探测'],
  ['docs/DEPLOY_ALIYUN_CN.md', '完整分步指南'],
  ['docs/CN_LAUNCH_P0.md', '迁阿里云 P0 清单'],
]
for (const [path, desc] of assets) {
  const ok = existsSync(join(root, path))
  console.log(`  ${ok ? '✅' : '❌'} ${path} — ${desc}`)
}

if (checkEnv) {
  console.log('\n--- .env.production 检查 ---')
  const envPath = join(root, '.env.production')
  if (!existsSync(envPath)) {
    console.log('  ⚠️  未找到 .env.production')
    console.log('  → cp deploy/aliyun/env.production.example .env.production')
  } else {
    const env = Object.fromEntries(parseEnvLocalContent(readFileSync(envPath, 'utf8')))
    const required = ['DATABASE_URL', 'AUTH_SECRET']
    for (const key of required) {
      console.log(env[key]?.trim() ? `  ✅ ${key}` : `  ❌ ${key} 未设置`)
    }
    const appUrl = env.APP_URL?.trim()
    if (!appUrl || appUrl.includes('example.com')) {
      console.log('  ⚠️  APP_URL — 备案通过后再改为正式 https 域名')
    } else {
      console.log(`  ✅ APP_URL ${appUrl}`)
    }
  }
}

console.log('\n下一步：')
console.log('  npm run aliyun:p0 --env')
console.log('  阅读 docs/CN_LAUNCH_P0.md → docs/DEPLOY_ALIYUN_CN.md\n')
