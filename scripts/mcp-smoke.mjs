/**
 * MCP smoke: catalog + proxy handler + optional live API (requires auth cookie).
 *
 * Usage:
 *   npm run mcp:smoke
 *   API_BASE=https://ai-ide-flame.vercel.app npm run mcp:smoke
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

function checkCatalog() {
  const catalogPath = join(root, 'src/data/mcpOfficialCatalog.ts')
  if (!existsSync(catalogPath)) {
    fail('mcpOfficialCatalog.ts', 'missing')
    return false
  }
  const text = readFileSync(catalogPath, 'utf8')
  const presetCount = (text.match(/id:\s*'/g) || []).length
  if (presetCount < 3) {
    fail('MCP official presets', `expected ≥3, got ${presetCount}`)
    return false
  }
  pass('MCP official presets', `${presetCount} entries`)
  return true
}

function checkProxyHandler() {
  const handler = join(root, 'lib/api/handlers/mcp/proxy.ts')
  if (!existsSync(handler)) {
    fail('mcp/proxy handler', 'missing')
    return false
  }
  const text = readFileSync(handler, 'utf8')
  if (!text.includes('requireAuth')) {
    fail('mcp/proxy auth', 'requireAuth not found')
    return false
  }
  pass('mcp/proxy handler', 'requireAuth present')
  return true
}

async function checkLiveProxyUnauthenticated() {
  try {
    const res = await fetch(`${apiBase}/api/mcp/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/mcp',
        message: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401 || res.status === 403) {
      pass('POST /api/mcp/proxy (no session)', `HTTP ${res.status} — auth required`)
      return true
    }
    if (res.status === 400) {
      pass('POST /api/mcp/proxy (no session)', `HTTP 400 — reached handler`)
      return true
    }
    fail('POST /api/mcp/proxy (no session)', `unexpected HTTP ${res.status}`)
    return false
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    fail('POST /api/mcp/proxy (live)', `unreachable: ${msg} (run dev:api or set API_BASE)`)
    return false
  }
}

async function main() {
  console.log('MCP smoke — AI IDE\n')
  let ok = checkCatalog() & checkProxyHandler()

  if (process.env.MCP_SMOKE_SKIP_LIVE === '1') {
    console.log('(skipped live API — MCP_SMOKE_SKIP_LIVE=1)')
  } else {
    ok = (await checkLiveProxyUnauthenticated()) && ok
  }

  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(ok && failed === 0 ? 0 : 1)
}

main()
