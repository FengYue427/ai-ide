#!/usr/bin/env node
/**
 * SSH 到 ECS 执行 install-on-server.sh（npm ci · migrate · pm2）
 *
 *   npm run aliyun:remote-install
 */
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { loadEnvAliyunOrExit, getAliyunDeployPath } from './load-env-aliyun.mjs'

loadEnvAliyunOrExit()

const ssh = process.env.ALIYUN_SSH.trim()
const remotePath = getAliyunDeployPath()
const script = "sed -i 's/\\r$//' deploy/aliyun/install-on-server.sh && bash deploy/aliyun/install-on-server.sh"

console.log(`=== 远程安装 @ ${ssh}:${remotePath} ===\n`)

const r = spawnSync('ssh', [ssh, `cd ${remotePath} && ${script}`], {
  stdio: 'inherit',
})

process.exit(r.status ?? 1)
