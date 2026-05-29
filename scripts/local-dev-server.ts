/**
 * Local API server for development (no Vercel CLI required).
 * Listens on PORT (default 3001). Pair with Vite proxy via `npm run dev:stack`.
 */
import { createServer, type Server } from 'node:http'
import { dispatchApiRequest } from '../lib/api/dispatch'
import { prisma } from '../src/lib/prisma'
import { loadEnvLocal } from './load-env-local.mjs'

const PORT = Number(process.env.API_PORT || 3001)

async function handleNodeRequest(
  nodeReq: import('node:http').IncomingMessage,
  nodeRes: import('node:http').ServerResponse,
) {
  const host = nodeReq.headers.host || `127.0.0.1:${PORT}`
  const url = `http://${host}${nodeReq.url || '/'}`
  const method = nodeReq.method || 'GET'

  const chunks: Buffer[] = []
  for await (const chunk of nodeReq) {
    chunks.push(chunk as Buffer)
  }
  const body = Buffer.concat(chunks)

  const headers = new Headers()
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
    else headers.set(key, value)
  }

  const req = new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })

  let response: Response
  try {
    response = await dispatchApiRequest(req)
  } catch (error) {
    console.error('[local-dev-server]', error)
    response = new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  nodeRes.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      nodeRes.appendHeader(key, value)
    } else {
      nodeRes.setHeader(key, value)
    }
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  nodeRes.end(buffer)
}

loadEnvLocal()

const server: Server = createServer((req, res) => {
  handleNodeRequest(req, res).catch((err) => {
    console.error(err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Server error' }))
  })
})

let shuttingDown = false

async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  await new Promise<void>((resolve) => {
    server.close(() => resolve())
  })

  try {
    await prisma.$disconnect()
  } catch {
    // ignore — CI teardown
  }

  process.exit(exitCode)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(0)
  })
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[local-dev-server] http://127.0.0.1:${PORT}`)
  console.log('[local-dev-server] DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING')
})
