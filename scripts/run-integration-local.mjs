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

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')
const skipDbSetup = process.env.SKIP_DB_SETUP === '1'

let apiChild = null
const apiLogPath = join(root, 'api-server.log')

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

function startApiServer() {
  return new Promise((resolve, reject) => {
    apiChild = spawn('npm', ['run', 'dev:api'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: process.env,
    })

    const logStream = createWriteStream(apiLogPath, { flags: 'a' })
    const tee = (chunk, out) => {
      out.write(chunk)
      logStream.write(chunk)
    }
    apiChild.stdout?.on('data', (chunk) => tee(chunk, process.stdout))
    apiChild.stderr?.on('data', (chunk) => tee(chunk, process.stderr))
    apiChild.on('error', reject)

    setTimeout(() => resolve(), 1500)
  })
}

function stopApiServer() {
  if (!apiChild || apiChild.killed) return

  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(apiChild.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
      apiChild.kill('SIGTERM')
    }
  } catch {
    // ignore
  } finally {
    apiChild = null
  }
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
    stopApiServer()
  }
}

process.on('SIGINT', () => {
  stopApiServer()
  process.exit(130)
})

main()
