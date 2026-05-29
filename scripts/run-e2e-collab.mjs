#!/usr/bin/env node
/**
 * Run Playwright collab smoke with VITE_COLLAB_M1_SIGNAL enabled (cross-platform).
 */
import { spawnSync } from 'node:child_process'

process.env.E2E_TARGET = 'collab'

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(cmd, ['playwright', 'test', '--project=collab'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

process.exit(result.status ?? 1)
