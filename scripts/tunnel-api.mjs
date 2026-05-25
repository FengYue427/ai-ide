/**
 * HTTPS tunnel to local API (port 3001) without installing ngrok.
 * Usage: npm run tunnel:api
 *
 * Copy the printed https URL into .env.local:
 *   PAYMENT_NOTIFY_URL=https://xxxx.loca.lt
 * Then restart: npm run dev:stack
 */
import { spawn } from 'node:child_process'

const port = process.env.API_PORT || '3001'

console.log(`[tunnel:api] Starting localtunnel → http://127.0.0.1:${port}`)
console.log('[tunnel:api] Keep this terminal open while testing Alipay.\n')

const child = spawn(
  'npx',
  ['--yes', 'localtunnel', '--port', String(port)],
  { stdio: 'inherit', shell: true },
)

child.on('exit', (code) => process.exit(code ?? 0))
