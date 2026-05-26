/**
 * Build + publish desktop artifacts to GitHub Releases (requires GH_TOKEN).
 *
 * Usage:
 *   set GH_TOKEN=ghp_...
 *   npm run electron:publish
 *
 * Tags: push git tag v1.0.1 then run, or CI on tag push.
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

if (!process.env.GH_TOKEN?.trim()) {
  console.error('GH_TOKEN is required to publish desktop releases to GitHub.')
  process.exit(1)
}

console.log('=== AI IDE desktop publish (GitHub Releases) ===\n')
run('npx', [
  'electron-builder',
  '--config',
  'electron-builder.yml',
  '--win',
  'portable',
  'nsis',
  '--publish',
  'always',
])
console.log('\n✅ Published. Users with packaged app will receive updates via electron-updater.')
