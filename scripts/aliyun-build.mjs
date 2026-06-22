#!/usr/bin/env node
/**
 * 本地构建阿里云产物（dist + api bundle），不在此步连 RDS 迁移（服务器上 migrate）。
 *
 *   npm run aliyun:build
 */
import { existsSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadProductionEnv } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(label, cmd, args) {
  console.log(`\n=== ${label} ===`)
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, env: process.env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const prodExample = join(root, '.env.production.example')
const prodEnv = join(root, '.env.production')
if (!existsSync(prodEnv) && existsSync(prodExample)) {
  copyFileSync(prodExample, prodEnv)
  console.log('[aliyun:build] created .env.production from example')
}

loadProductionEnv()

run('build:api', 'npm', ['run', 'build:api'])
run('vite build', 'npx', ['vite', 'build', '--outDir', 'dist-aliyun'])
process.env.AI_IDE_DIST_DIR = 'dist-aliyun'
run('copy:website', 'node', ['scripts/copy-website.mjs'])

console.log('\n✅ 阿里云构建完成 — dist-aliyun/ 已更新（同步时会在服务器上作为 dist/）')
console.log('   下一步: npm run aliyun:deploy  或  npm run aliyun:sync')
