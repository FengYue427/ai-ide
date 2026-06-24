/**
 * Ensure node-pty is compiled for the installed Electron runtime before desktop pack.
 */
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('=== Electron PTY preflight ===\n')

try {
  require.resolve('node-pty')
} catch {
  console.log('Installing node-pty (optional dependency)...')
  run('npm', ['install', 'node-pty', '--no-save', '--include=optional'])
}

console.log('Rebuilding node-pty for Electron...')
run('npx', ['@electron/rebuild', '-f', '-w', 'node-pty'])

try {
  require('node-pty')
  console.log('\n✅ node-pty ready for Electron desktop pack')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\n❌ node-pty failed to load after rebuild: ${message}`)
  console.error('   Desktop terminal will fall back to line REPL in the packaged app.')
  process.exit(1)
}
