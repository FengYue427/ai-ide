/**
 * Launch Electron with dev server URL (Windows/mac/Linux).
 */
import { spawn } from 'child_process'
import electron from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const main = path.join(root, 'electron', 'main.mjs')
const devUrl = process.env.ELECTRON_VITE_DEV_SERVER_URL || 'http://127.0.0.1:3000'

const child = spawn(electron, [main], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_VITE_DEV_SERVER_URL: devUrl,
  },
})

child.on('exit', (code) => process.exit(code ?? 0))
