#!/usr/bin/env node
/**
 * Run Playwright fullstack E2E (dev:stack + Postgres).
 * CI runs db push/seed before this script; locally: npm run db:setup
 */
import { spawnSync } from 'node:child_process'

process.env.E2E_TARGET = 'fullstack'
process.env.CI = process.env.CI || ''

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(cmd, ['playwright', 'test', '--project=fullstack'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

process.exit(result.status ?? 1)
