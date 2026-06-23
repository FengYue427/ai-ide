/**
 * CN release: web deploy + desktop pack checklist (Sprint A).
 *
 * Usage:
 *   npm run release:cn                  # deploy only
 *   npm run release:cn -- --with-desktop  # deploy + electron pack
 */
import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const withDesktop = process.argv.includes('--with-desktop')
const skipSmoke = process.argv.includes('--skip-smoke') || !process.argv.includes('--smoke')

function run(label, cmd, args) {
  console.log(`\n=== ${label} ===\n`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('=== AI IDE CN Release (Sprint A) ===\n')

run('test:local', 'npm', ['run', 'test:local'])

const deployArgs = ['run', 'aliyun:deploy', '--', '--with-env']
if (skipSmoke) deployArgs.push('--skip-smoke')
run('aliyun:deploy', 'npm', deployArgs)

const electronEnv = join(root, '.env.electron')
if (!existsSync(electronEnv)) {
  console.error('❌ Missing .env.electron — copy from .env.electron.billing.example')
  process.exit(1)
}

const envText = readFileSync(electronEnv, 'utf8')
const apiMatch = envText.match(/VITE_API_BASE_URL\s*=\s*(\S+)/)
const apiBase = apiMatch?.[1] ?? '(unset)'

console.log('\n=== Desktop parity checklist ===\n')
console.log(`• VITE_API_BASE_URL=${apiBase}`)
console.log('• Web deploy finished — UI/API on server')
console.log('• Desktop UI is NOT auto-synced — rebuild required:')
console.log('    npm run electron:pack:offline')
console.log('• Verify on desktop after pack:')
console.log('  - Intent Shell / Autopilot / 关系网')
console.log('  - Git Pull/Push (origin remote)')
console.log('  - Login / billing / Background Agent')

if (withDesktop) {
  run('electron:pack:offline', 'npm', ['run', 'electron:pack:offline'])
  console.log('\n✅ CN release complete (web + desktop portable)')
} else {
  console.log('\n✅ CN web release complete')
  console.log('   Add --with-desktop to also run electron:pack:offline')
}
