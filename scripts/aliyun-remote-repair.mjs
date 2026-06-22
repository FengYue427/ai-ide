#!/usr/bin/env node
/**
 * Repair corrupted node_modules on ECS and rerun install-on-server.sh
 */
import { spawnSync } from 'child_process'
import { loadEnvAliyunOrExit, getAliyunDeployPath } from './load-env-aliyun.mjs'

loadEnvAliyunOrExit()

const ssh = process.env.ALIYUN_SSH.trim()
const remotePath = getAliyunDeployPath()
const script = [
  `cd ${remotePath}`,
  'rm -rf node_modules',
  "sed -i 's/\\r$//' deploy/aliyun/install-on-server.sh",
  'bash deploy/aliyun/install-on-server.sh',
].join(' && ')

console.log(`=== 远程修复 @ ${ssh}:${remotePath} ===\n`)

const r = spawnSync('ssh', [ssh, script], { stdio: 'inherit' })
process.exit(r.status ?? 1)
