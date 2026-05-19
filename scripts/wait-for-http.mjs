/**
 * Wait until a URL returns HTTP 2xx/3xx/4xx (server is listening).
 * Usage: node scripts/wait-for-http.mjs http://127.0.0.1:3001/api/auth/session
 */
const url = process.argv[2]
const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS || 60_000)
const intervalMs = 500

if (!url) {
  console.error('Usage: node scripts/wait-for-http.mjs <url>')
  process.exit(1)
}

const started = Date.now()

async function probe() {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (res.status >= 200 && res.status < 600) {
      console.log(`✅ ${url} responded (${res.status}) after ${Date.now() - started}ms`)
      process.exit(0)
    }
  } catch {
    // retry
  }

  if (Date.now() - started > timeoutMs) {
    console.error(`❌ Timeout waiting for ${url}`)
    process.exit(1)
  }

  setTimeout(probe, intervalMs)
}

probe()
