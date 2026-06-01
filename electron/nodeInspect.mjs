/**
 * Spawn local `node --inspect-brk` for Electron desktop debug (v1.1.7.2).
 */
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

const INSPECT_URL_RE = /ws:\/\/[^\s"'`\s]+/gi
const DEFAULT_PORT = 9230

const activeSessions = new Map()

function parseInspectUrl(chunk) {
  const matches = chunk.match(INSPECT_URL_RE)
  if (!matches?.length) return null
  return matches[matches.length - 1]
}

async function entryExists(rootPath, entryFile) {
  try {
    await fs.access(path.join(rootPath, entryFile))
    return true
  } catch {
    return false
  }
}

/**
 * @param {{ rootPath: string, entryFile: string, port?: number, onExit?: (code: number | null) => void }} input
 */
export function spawnNodeInspectSession({ rootPath, entryFile, port = DEFAULT_PORT, onExit }) {
  const root = path.resolve(String(rootPath ?? ''))
  const entry = String(entryFile ?? 'index.js').replace(/^[/\\]+/, '')
  if (!root) {
    return { ok: false, reason: 'NO_ROOT' }
  }

  const sessionId = `inspect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const inspectFlag = `--inspect-brk=127.0.0.1:${port}`
  const args = [inspectFlag, entry]

  return new Promise((resolve) => {
    let settled = false
    let outputBuffer = ''
    let inspectUrl = null
    let child = null

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    child = spawn('node', args, {
      cwd: root,
      env: process.env,
      windowsHide: true,
      shell: false,
    })

    const timer = setTimeout(() => {
      if (inspectUrl) return
      child?.kill()
      activeSessions.delete(sessionId)
      finish({ ok: false, reason: 'INSPECT_URL_TIMEOUT', sessionId })
    }, 12_000)

    const appendOutput = (chunk) => {
      outputBuffer += chunk.toString()
      if (!inspectUrl) {
        const parsed = parseInspectUrl(outputBuffer)
        if (parsed) {
          inspectUrl = parsed
          activeSessions.set(sessionId, child)
          finish({
            ok: true,
            sessionId,
            inspectUrl,
            port,
            entryFile: entry,
          })
        }
      }
    }

    child.stdout?.on('data', appendOutput)
    child.stderr?.on('data', appendOutput)

    child.on('error', (error) => {
      activeSessions.delete(sessionId)
      finish({ ok: false, reason: 'SPAWN_FAILED', detail: error.message, sessionId })
    })

    child.on('close', (code) => {
      activeSessions.delete(sessionId)
      onExit?.(sessionId, code)
    })
  })
}

export function killNodeInspectSession(sessionId) {
  const child = activeSessions.get(sessionId)
  if (!child) return false
  try {
    child.kill()
  } catch {
    /* ignore */
  }
  activeSessions.delete(sessionId)
  return true
}

export async function validateInspectEntry(rootPath, entryFile) {
  const root = path.resolve(String(rootPath ?? ''))
  const entry = String(entryFile ?? 'index.js').replace(/^[/\\]+/, '')
  if (!root) return { ok: false, reason: 'NO_ROOT' }
  if (!(await entryExists(root, entry))) {
    return { ok: false, reason: 'ENTRY_NOT_FOUND', entryFile: entry }
  }
  return { ok: true, entryFile: entry }
}
