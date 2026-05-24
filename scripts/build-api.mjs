/**
 * Bundle Vercel /api router (lib/api/*) into api/index.js for serverless deploy.
 * Fixes: ERR_MODULE_NOT_FOUND /var/task/lib/api/dispatch on Vercel.
 */
import * as esbuild from 'esbuild'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(root, 'server', 'vercel-api-index.ts')
const outfile = join(root, 'api', 'index.js')

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile,
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
})

console.log(`✅ API bundle: ${outfile}`)
console.log('ℹ️  Commit api/index.js when lib/api handlers change (Vercel validates api/ before build).')
