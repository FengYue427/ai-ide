/**
 * Build Windows portable desktop (remote shell → production web + native preload).
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('=== AI IDE desktop pack (remote shell) ===\n')
run('node', ['scripts/electron-builder-run.mjs', '--win', 'portable', '--publish', 'never'])
console.log('\n✅ Output: release/AI-IDE-*-win-portable.exe')
