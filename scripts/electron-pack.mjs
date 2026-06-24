/**
 * Build Windows portable desktop: offline UI (dist/) + remote API (VITE_API_BASE_URL in .env.electron).
 * Avoids loading *.vercel.app in the shell when the page is blocked in China.
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('=== AI IDE desktop pack (offline UI + remote API) ===\n')
run('node', ['scripts/electron-rebuild-pty.mjs'])
run('npm', ['run', 'build:electron'])
run('node', [
  'scripts/electron-builder-run.mjs',
  '--config',
  'electron-builder.offline.yml',
  '--win',
  'portable',
  '--publish',
  'never',
])
console.log('\n✅ Output: release/AI-IDE-*-win-portable.exe')
console.log('   API: .env.electron VITE_API_BASE_URL · billing Pro ¥39 / Team ¥79 (rebuild after env change)')
