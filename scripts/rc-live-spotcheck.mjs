#!/usr/bin/env node
/**
 * v1.0.3 Phase 2 — live 竞品抽测（自动化 + 人工清单）。
 *
 * Usage:
 *   npm run rc:live-spotcheck
 *   APP_URL=https://ide.example.com npm run rc:live-spotcheck
 *   node scripts/rc-live-spotcheck.mjs --allow-stale-version
 *
 * See docs/V1.0.3_RC.md
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const base = (process.env.APP_URL || 'https://ai-ide-flame.vercel.app').replace(/\/$/, '')
const allowStaleVersion = process.argv.includes('--allow-stale-version')

const pkgVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
const expectVersion = process.env.EXPECT_VERSION?.trim() || pkgVersion

const lines = []
let failed = 0
let warned = 0
const now = new Date().toISOString()

function pass(label, detail) {
  lines.push(`- [x] **${label}** — ${detail}`)
}

function fail(label, detail) {
  lines.push(`- [ ] **${label}** — ${detail}`)
  failed++
}

function warn(label, detail) {
  lines.push(`- [~] **${label}** — ${detail}`)
  warned++
}

function manual(label, steps) {
  lines.push(`- [ ] **${label}** _(manual)_ — ${steps}`)
}

lines.push('# v1.0.3 RC live spotcheck')
lines.push('')
lines.push(`- **URL**: ${base}`)
lines.push(`- **Time**: ${now}`)
lines.push(`- **Expect version**: ${expectVersion}`)
lines.push('')
lines.push('## Automated')
lines.push('')

async function fetchJson(path) {
  const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(30_000) })
  const ct = res.headers.get('content-type') || ''
  const json = ct.includes('application/json') ? await res.json() : null
  return { res, json }
}

async function fetchMainBundle() {
  const htmlRes = await fetch(`${base}/`, { signal: AbortSignal.timeout(30_000) })
  if (!htmlRes.ok) return null
  const html = await htmlRes.text()
  const match = html.match(/src="(\.\/assets\/index-[^"]+\.js)"/)
  if (!match) return null
  const assetPath = match[1].replace(/^\.\//, '')
  const jsRes = await fetch(`${base}/${assetPath}`, { signal: AbortSignal.timeout(45_000) })
  if (!jsRes.ok) return null
  return jsRes.text()
}

console.log(`# RC live spotcheck → ${base}`)
console.log(`Expect version: ${expectVersion}\n`)

// --- API / infra ---
try {
  const { res, json } = await fetchJson('/api/health')
  const ok = res.ok && json?.status === 'ok' && json?.database === 'connected'
  if (ok) {
    pass('health', `${json.status} db=${json.database} version=${json.version ?? '?'}`)
    if (json.version === expectVersion) {
      pass('deploy version', json.version)
    } else if (allowStaleVersion) {
      warn('deploy version', `got ${json.version ?? '?'}, expect ${expectVersion} (allowed)`)
    } else {
      warn(
        'deploy version',
        `got ${json.version ?? '?'}, expect ${expectVersion} — redeploy then re-run (or --allow-stale-version)`,
      )
    }
  } else {
    fail('health', `HTTP ${res.status} status=${json?.status ?? '?'} db=${json?.database ?? '?'}`)
  }
} catch (e) {
  fail('health', e instanceof Error ? e.message : String(e))
}

try {
  const { res, json } = await fetchJson('/api/auth/session')
  if (res.ok) pass('Chat (API)', 'session endpoint OK')
  else fail('Chat (API)', `HTTP ${res.status}`)
} catch (e) {
  fail('Chat (API)', e instanceof Error ? e.message : String(e))
}

try {
  const { res, json } = await fetchJson('/api/subscription')
  const ok = res.ok && json?.subscription?.plan === 'free'
  if (ok) pass('Chat (quota)', 'anonymous free plan')
  else fail('Chat (quota)', `HTTP ${res.status}`)
} catch (e) {
  fail('Chat (quota)', e instanceof Error ? e.message : String(e))
}

try {
  const { res, json } = await fetchJson('/api/health')
  const alipay = json?.billing?.alipay === true
  const wechat = json?.billing?.wechat === true
  if (alipay && !wechat) {
    pass('支付宝 (API)', 'billing.alipay=true, wechat=false (1.0.3 决策)')
  } else {
    fail('支付宝 (API)', `alipay=${json?.billing?.alipay} wechat=${json?.billing?.wechat}`)
  }
} catch (e) {
  fail('支付宝 (API)', e instanceof Error ? e.message : String(e))
}

// --- Bundle markers (1.0.2.x features on live) ---
let bundle = null
try {
  bundle = await fetchMainBundle()
  if (bundle) {
    pass('frontend bundle', `${(bundle.length / 1024).toFixed(0)} KB main chunk`)
  } else {
    fail('frontend bundle', 'could not resolve index-*.js from /')
  }
} catch (e) {
  fail('frontend bundle', e instanceof Error ? e.message : String(e))
}

if (bundle) {
  const checks = [
    { label: 'Agent + hunk (bundle)', needle: 'showAgentApplyModal', hint: '块级 Diff 预览' },
    { label: 'Tab FIM (bundle)', needle: 'inlineCompletion', hint: '设置 → 编辑器 Tab 补全' },
    { label: '@ 索引 (bundle)', needle: 'chat.indexOk', hint: '@ 提及与索引上限' },
  ]
  for (const { label, needle, hint } of checks) {
    if (bundle.includes(needle)) pass(label, hint)
    else fail(label, `missing "${needle}" in main bundle`)
  }
}

lines.push('')
lines.push('## 竞品 live 抽测 — 人工（5 项）')
lines.push('')
manual(
  '1. Chat',
  'BYOK 或 Ollama → 发送「解释当前文件」；确认流式回复与配额计数',
)
manual(
  '2. Agent + hunk',
  'Agent 开 → write_file（自动应用关）→ 块级 Diff 接受/拒绝 → 应用已选块',
)
manual(
  '3. Tab',
  '设置 → 编辑器 → Tab 补全开 → 编辑器内停顿触发幽灵补全',
)
manual(
  '4. @ 索引',
  '导入 ≥10 文件 → Chat 输入 `@` 选文件 → 确认上下文注入与索引进度',
)
manual(
  '5. 支付宝',
  '设置 → 查看套餐 → 专业版下单（沙箱或生产 Path B）→ 回调后 plan=pro',
)

lines.push('')
lines.push(`**Automated**: ${failed === 0 ? 'pass' : `${failed} failed`}${warned ? `, ${warned} warn` : ''}`)
if (failed > 0) {
  lines.push('')
  lines.push('## Next steps')
  lines.push('')
  lines.push('1. `npm run go-live:preflight`')
  lines.push('2. Vercel redeploy → re-run `npm run rc:live-spotcheck`')
  lines.push('3. 完成上方 5 项人工 checklist → [V1.0.3_RC.md](../docs/V1.0.3_RC.md)')
}

const report = lines.join('\n')
console.log('\n' + report)

const outPath = join(root, 'docs', 'RC_LIVE_SPOTCHECK_LAST.md')
writeFileSync(outPath, `${report}\n`, 'utf8')
console.log(`\nWrote ${outPath}`)

process.exit(failed > 0 ? 1 : 0)
