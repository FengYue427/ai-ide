/**
 * One-shot local API integration: DB check → migrate/seed → start dev:api → run tests → stop API.
 *
 * Usage:
 *   node scripts/run-integration-local.mjs
 *   SKIP_DB_SETUP=1 node scripts/run-integration-local.mjs   # skip push/seed
 */
import { spawn, spawnSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal } from './load-env-local.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
loadEnvLocal()
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')
const skipDbSetup = process.env.SKIP_DB_SETUP === '1'
const isWin = process.platform === 'win32'

let apiChild = null
const apiLogPath = join(root, 'api-server.log')
let apiLogStream = null

const STOP_GRACE_MS = 3_000
const STOP_FORCE_MS = 10_000

function runNodeScript(scriptName, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join('scripts', scriptName)], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...extraEnv },
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${scriptName} exited with code ${code}`))
    })
  })
}

function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', scriptName], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`npm run ${scriptName} exited with code ${code}`))
    })
  })
}

function closeApiLogStream() {
  if (!apiLogStream) return
  try {
    apiLogStream.end()
  } catch {
    // ignore
  } finally {
    apiLogStream = null
  }
}

function detachApiStreams(child) {
  child.stdout?.removeAllListeners('data')
  child.stderr?.removeAllListeners('data')
  child.stdout?.destroy()
  child.stderr?.destroy()
}

function signalApiTree(child, signal) {
  if (!child?.pid) return
  if (isWin) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', shell: true })
    return
  }
  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // ignore
    }
  }
}

function startApiServer() {
  return new Promise((resolve, reject) => {
    // Direct tsx spawn (no npm/shell) + detached process group on Linux/macOS for reliable teardown in CI.
    const args = ['tsx', 'scripts/local-dev-server.ts']
    const command = isWin ? 'npx.cmd' : 'npx'

    apiChild = spawn(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: !isWin,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
    })

    apiLogStream = createWriteStream(apiLogPath, { flags: 'a' })
    const tee = (chunk, out) => {
      out.write(chunk)
      apiLogStream?.write(chunk)
    }
    apiChild.stdout?.on('data', (chunk) => tee(chunk, process.stdout))
    apiChild.stderr?.on('data', (chunk) => tee(chunk, process.stderr))
    apiChild.on('error', reject)

    setTimeout(() => resolve(), 1500)
  })
}

function stopApiServer() {
  return new Promise((resolve) => {
    closeApiLogStream()

    const child = apiChild
    apiChild = null
    if (!child || child.killed) {
      resolve()
      return
    }

    detachApiStreams(child)

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    child.once('exit', finish)

    signalApiTree(child, 'SIGTERM')

    setTimeout(() => {
      if (child.exitCode != null) return
      signalApiTree(child, 'SIGKILL')
    }, STOP_GRACE_MS).unref()

    setTimeout(() => {
      signalApiTree(child, 'SIGKILL')
      finish()
    }, STOP_FORCE_MS).unref()
  })
}

async function main() {
  console.log('=== Local integration runner ===\n')

  try {
    console.log('[1/5] Database connectivity…')
    const dbCheck = spawnSync('node', ['scripts/check-db.mjs'], { cwd: root, stdio: 'inherit', shell: true })
    if (dbCheck.status !== 0) process.exit(1)

    if (!skipDbSetup) {
      console.log('\n[2/5] Prisma push + seed…')
      const push = spawnSync('npx', ['prisma', 'db', 'push'], { cwd: root, stdio: 'inherit', shell: true })
      if (push.status !== 0) process.exit(1)
      await runNpmScript('db:seed')
    } else {
      console.log('\n[2/5] Skipped DB setup (SKIP_DB_SETUP=1)')
    }

    console.log('\n[3/5] Starting API on :3001…')
    await startApiServer()

    console.log('\n[4/5] Waiting for API…')
    const wait = spawnSync('node', ['scripts/wait-for-http.mjs', `${apiBase}/api/auth/session`], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    })
    if (wait.status !== 0) process.exit(1)

    console.log('\n[5/5] Running integration tests…')
    await runNodeScript('integration-api-offline.mjs', { API_BASE: apiBase })
    await runNodeScript('integration-api.mjs', { API_BASE: apiBase })

    console.log('\n=== All local integration tests passed ===')
  } catch (error) {
    console.error('\n=== Local integration failed ===')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    console.log('\nStopping API server…')
    await stopApiServer()
  }
}

process.on('SIGINT', async () => {
  await stopApiServer()
  process.exit(130)
})

main()
  .then(() => {
    process.exit(process.exitCode ?? 0)
  })
  .catch(async (error) => {
    console.error(error)
    await stopApiServer()
    process.exit(1)
  })
