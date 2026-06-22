#!/usr/bin/env node
/**
 * Neon → 阿里云 RDS 数据迁移
 *
 *   cp .env.aliyun.example .env.aliyun   # 填 SOURCE_* / TARGET_*
 *   npm run db:migrate:neon-to-rds
 *   npm run db:migrate:neon-to-rds -- --dry-run
 *   npm run db:migrate:neon-to-rds -- --schema-only   # 仅结构，不导数据
 *
 * 依赖：本机已安装 PostgreSQL 客户端（pg_dump / pg_restore / psql）
 * Windows：安装 PostgreSQL 或使用 WSL。
 */
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvAliyun, maskDbUrl } from './load-env-aliyun.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dryRun = process.argv.includes('--dry-run')
const schemaOnly = process.argv.includes('--schema-only')
const dumpPath = join(root, '.cache', 'ai-ide-neon.dump')

loadEnvAliyun()

const source = process.env.SOURCE_DATABASE_URL?.trim() || process.env.NEON_DATABASE_URL?.trim()
const target =
  process.env.TARGET_DATABASE_URL?.trim() ||
  process.env.RDS_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim()

if (!source || !target) {
  console.error('❌ 需要 SOURCE_DATABASE_URL 与 TARGET_DATABASE_URL（.env.aliyun 或环境变量）')
  process.exit(1)
}

if (source === target) {
  console.error('❌ SOURCE 与 TARGET 不能相同')
  process.exit(1)
}

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
    shell: true,
  })
  return r.status === 0
}

for (const bin of ['pg_dump', 'pg_restore', 'psql']) {
  if (!which(bin)) {
    console.error(`❌ 未找到 ${bin} — 请安装 PostgreSQL 客户端`)
    process.exit(1)
  }
}

function run(label, cmd, args) {
  console.log(`\n=== ${label} ===`)
  console.log(`${cmd} ${args.join(' ')}`.replace(/:[^:@/]+@/g, ':****@'))
  if (dryRun) return 0
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env })
  return r.status ?? 1
}

console.log('=== Neon → RDS 迁移 ===')
console.log('Source:', maskDbUrl(source))
console.log('Target:', maskDbUrl(target))
if (schemaOnly) console.log('Mode: schema-only (no data rows)')
if (dryRun) console.log('Mode: dry-run (print commands only)\n')

if (!dryRun) {
  mkdirSync(join(root, '.cache'), { recursive: true })
}

const dumpArgs = [
  `--dbname=${source}`,
  '--no-owner',
  '--no-acl',
  '-Fc',
  '-f',
  dumpPath,
  ...(schemaOnly ? ['--schema-only'] : []),
]

let code = run('pg_dump', 'pg_dump', dumpArgs)
if (code !== 0) process.exit(code)

const restoreArgs = [
  `--dbname=${target}`,
  '--no-owner',
  '--no-acl',
  '--clean',
  '--if-exists',
  dumpPath,
]

code = run('pg_restore', 'pg_restore', restoreArgs)
if (code !== 0 && !dryRun) {
  console.warn('⚠️  pg_restore 退出码非 0（部分对象已存在时可忽略，继续 migrate deploy）')
}

if (!dryRun) {
  console.log('\n=== prisma migrate deploy（对齐迁移历史）===')
  process.env.DATABASE_URL = target
  const migrate = spawnSync('npm', ['run', 'db:migrate:deploy'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  code = migrate.status ?? 1

  try {
    unlinkSync(dumpPath)
  } catch {
    // ignore
  }
}

if (code === 0) {
  console.log('\n✅ 迁库完成。请在 RDS 上验证：npm run db:migrate:status')
} else {
  console.error('\n❌ 迁库未完成')
}
process.exit(code)
