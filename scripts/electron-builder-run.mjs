#!/usr/bin/env node
/**
 * electron-builder rejects non-semver `package.json#version` (e.g. 1.0.6.4).
 * Temporarily maps to semver for the build, restores afterward, keeps artifact names on product version.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toElectronSemver } from './electron-semver.mjs'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const pkgPath = join(root, 'package.json')
const backup = readFileSync(pkgPath, 'utf8')
const pkg = JSON.parse(backup)
const productVersion = String(pkg.version ?? '').trim()
const electronVersion = toElectronSemver(productVersion)

pkg.version = electronVersion
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

const args = process.argv.slice(2)
const env = {
  ...process.env,
  PRODUCT_VERSION: productVersion,
}

try {
  const result = spawnSync(
    'npx',
    ['electron-builder', '--config', 'electron-builder.yml', ...args],
    { cwd: root, env, stdio: 'inherit', shell: true },
  )
  process.exit(result.status ?? 1)
} finally {
  writeFileSync(pkgPath, backup)
}
