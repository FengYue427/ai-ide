#!/usr/bin/env node
/**
 * 同步代码到阿里云 ECS（tar + scp；Windows 用临时文件避免 pipe 损坏）
 *
 *   npm run aliyun:sync
 *   npm run aliyun:sync -- --with-env
 */
import { existsSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvAliyunOrExit, getAliyunDeployPath } from './load-env-aliyun.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const withEnv = process.argv.includes('--with-env')

loadEnvAliyunOrExit()

const ssh = process.env.ALIYUN_SSH.trim()
const remotePath = getAliyunDeployPath()

if (!existsSync(join(root, 'dist-aliyun', 'index.html')) && !existsSync(join(root, 'dist', 'index.html'))) {
  console.error('❌ 未找到 dist-aliyun/index.html — 先运行 npm run aliyun:build')
  process.exit(1)
}

const excludeFlags = [
  'node_modules',
  '.git',
  'release',
  'dist-electron',
  '.cache',
  '.env.local',
  '.env.aliyun',
]
if (!withEnv) excludeFlags.push('.env.production')

console.log(`=== 同步到 ${ssh}:${remotePath} ===\n`)

function runSsh(remoteCommand) {
  return spawnSync('ssh', [ssh, remoteCommand], { stdio: 'inherit' })
}

const mkdir = runSsh(`mkdir -p ${remotePath}`)

if (mkdir.status !== 0) process.exit(mkdir.status ?? 1)

const tarExcludes = excludeFlags.flatMap((e) => ['--exclude', e])
const remoteTar = '/tmp/ai-ide-sync.tgz'

function uploadTarball(tarPath) {
  console.log('Uploading tarball …')
  const scp = spawnSync('scp', [tarPath, `${ssh}:${remoteTar}`], { stdio: 'inherit' })
  if (scp.status !== 0) process.exit(scp.status ?? 1)

  const verify = runSsh(`test -s ${remoteTar}`)
  if (verify.status !== 0) {
    console.error('\n❌ 上传未完成 — 请重试: npm run aliyun:sync')
    process.exit(1)
  }

  const extract = runSsh(`cd ${remotePath} && tar -xzf ${remoteTar} && rm -f ${remoteTar}`)
  if (extract.status !== 0) {
    console.error('\n❌ 同步失败 — 检查: ssh', ssh)
    process.exit(extract.status ?? 1)
  }
}

if (process.platform === 'win32') {
  const tarPath = join(tmpdir(), `ai-ide-sync-${Date.now()}.tgz`)
  console.log('Packaging (Windows temp file) …')
  const tar = spawnSync('tar', ['-czf', tarPath, ...tarExcludes, '.'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (tar.status !== 0) {
    console.error('❌ tar 打包失败')
    process.exit(tar.status ?? 1)
  }
  try {
    uploadTarball(tarPath)
  } finally {
    try {
      unlinkSync(tarPath)
    } catch {
      // ignore
    }
  }
} else {
  console.log('Uploading (tar | ssh) …')
  const tar = spawnSync('tar', ['-czf', '-', ...tarExcludes, '.'], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 512 * 1024 * 1024,
  })
  if (tar.status !== 0) {
    console.error('❌ tar 打包失败')
    if (tar.stderr?.length) process.stderr.write(tar.stderr)
    process.exit(tar.status ?? 1)
  }
  const extract = spawnSync('ssh', [ssh, `cd ${remotePath} && tar -xzf -`], {
    input: tar.stdout,
    stdio: ['pipe', 'inherit', 'inherit'],
    maxBuffer: 512 * 1024 * 1024,
  })
  if (extract.status !== 0) {
    console.error('\n❌ 同步失败 — 检查: ssh', ssh)
    process.exit(extract.status ?? 1)
  }
}

if (withEnv && existsSync(join(root, '.env.production'))) {
  console.log('\n=== 上传 .env.production ===')
  const scp = spawnSync('scp', [join(root, '.env.production'), `${ssh}:${remotePath}/.env.production`], {
    stdio: 'inherit',
  })
  if (scp.status !== 0) process.exit(scp.status ?? 1)
} else if (!withEnv) {
  console.log('\nℹ️  未上传 .env.production — 服务器需已有该文件，或 npm run aliyun:sync -- --with-env')
}

console.log('\n✅ 同步完成 → npm run aliyun:remote-install')
