#!/usr/bin/env node
/**
 * Upload Windows portable build to ECS static downloads folder.
 *
 *   npm run desktop:upload
 *   npm run desktop:upload -- path/to/custom.exe
 */
import { existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvAliyunOrExit, getAliyunDeployPath } from './load-env-aliyun.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const argPath = process.argv[2]

loadEnvAliyunOrExit()

const ssh = process.env.ALIYUN_SSH.trim()
const remotePath = getAliyunDeployPath()
const remoteDir = `${remotePath}/dist/downloads`

function findPortableExe() {
  if (argPath) {
    const resolved = join(process.cwd(), argPath)
    if (!existsSync(resolved)) {
      console.error(`❌ File not found: ${resolved}`)
      process.exit(1)
    }
    return resolved
  }

  const releaseDir = join(root, 'release')
  if (!existsSync(releaseDir)) {
    console.error('❌ release/ missing — run npm run electron:pack:offline first')
    process.exit(1)
  }

  const candidates = readdirSync(releaseDir)
    .filter((name) => /AI-IDE-.+-win-portable\.exe$/i.test(name))
    .sort()
  const latest = candidates.at(-1)
  if (!latest) {
    console.error('❌ No AI-IDE-*-win-portable.exe in release/')
    process.exit(1)
  }
  return join(releaseDir, latest)
}

const localExe = findPortableExe()
const fileName = localExe.split(/[/\\]/).pop()

console.log(`=== Upload desktop release ===\n`)
console.log(`Local : ${localExe}`)
console.log(`Remote: ${ssh}:${remoteDir}/${fileName}\n`)

const mkdir = spawnSync('ssh', [ssh, `mkdir -p ${remoteDir}`], { stdio: 'inherit' })
if (mkdir.status !== 0) process.exit(mkdir.status ?? 1)

const scp = spawnSync('scp', [localExe, `${ssh}:${remoteDir}/${fileName}`], { stdio: 'inherit' })
if (scp.status !== 0) process.exit(scp.status ?? 1)

console.log(`\n✅ Uploaded — https://你的域名/downloads/${fileName}`)
console.log('   Verify: curl -I "https://许红花.com/downloads/' + fileName + '"')
