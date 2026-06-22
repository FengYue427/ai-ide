/**
 * Load `.env.aliyun` for deploy/SSH/migration helpers (does not override existing env).
 */
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadEnvFromFile, loadProductionEnv } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const aliyunPath = join(root, '.env.aliyun')

export function loadEnvAliyun() {
  const loaded = existsSync(aliyunPath) ? loadEnvFromFile(aliyunPath) : false
  loadProductionEnv()
  return loaded
}

export function loadEnvAliyunOrExit() {
  loadEnvAliyun()
  if (!process.env.ALIYUN_SSH?.trim()) {
    console.error('❌ ALIYUN_SSH not set — cp .env.aliyun.example .env.aliyun')
    process.exit(1)
  }
}

export function getAliyunDeployPath() {
  return process.env.ALIYUN_DEPLOY_PATH?.trim() || '/opt/ai-ide'
}

export function maskDbUrl(raw) {
  return String(raw || '').replace(/:[^:@/]+@/, ':****@')
}
