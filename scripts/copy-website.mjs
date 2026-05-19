/**
 * Copy website/ marketing pages into dist/website/ after Vite build.
 * Cross-platform replacement for `cp -r website dist/`.
 */
import { cpSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const websiteSrc = join(root, 'website')
const websiteDest = join(distDir, 'website')

if (!existsSync(distDir)) {
  console.error('[copy-website] dist/ not found. Run `npm run build` first.')
  process.exit(1)
}

if (!existsSync(websiteSrc)) {
  console.error('[copy-website] website/ not found.')
  process.exit(1)
}

cpSync(websiteSrc, websiteDest, { recursive: true })
console.log('[copy-website] Copied website/ -> dist/website/')
