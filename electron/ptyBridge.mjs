/**
 * Optional node-pty bridge for Electron desktop (v1.1.5.5 spike).
 * Set AI_IDE_PTY=1 to attempt load; falls back when module missing.
 */

let ptyModule = null
let loadAttempted = false
let loadError = null

export async function loadPtyModule() {
  if (loadAttempted) return ptyModule
  loadAttempted = true
  if (process.env.AI_IDE_PTY === '0') {
    loadError = new Error('PTY disabled (AI_IDE_PTY=0)')
    return null
  }
  try {
    ptyModule = await import('node-pty')
    return ptyModule
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error))
    ptyModule = null
    return null
  }
}

export async function getPtyCapabilities() {
  const mod = await loadPtyModule()
  return {
    available: Boolean(mod?.spawn),
    reason: mod ? undefined : loadError?.message ?? 'node-pty not installed',
    platform: process.platform,
  }
}

const sessions = new Map()

export async function spawnPtySession({ sessionId, cwd, cols, rows, onData, onExit }) {
  const mod = await loadPtyModule()
  if (!mod?.spawn) return { ok: false, reason: loadError?.message ?? 'PTY unavailable' }

  const existing = sessions.get(sessionId)
  if (existing) {
    try {
      existing.kill()
    } catch {
      /* ignore */
    }
    sessions.delete(sessionId)
  }

  const shell = process.platform === 'win32'
    ? process.env.COMSPEC || 'powershell.exe'
    : process.env.SHELL || 'bash'

  try {
    const term = mod.spawn(shell, [], {
      name: 'xterm-color',
      cols: Math.max(1, cols || 80),
      rows: Math.max(1, rows || 24),
      cwd: cwd || process.cwd(),
      env: process.env,
    })

    term.onData((data) => onData?.(data))
    term.onExit(({ exitCode }) => {
      sessions.delete(sessionId)
      onExit?.(exitCode ?? 0)
    })

    sessions.set(sessionId, term)
    return { ok: true, shell }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) }
  }
}

export function writePtySession(sessionId, data) {
  const term = sessions.get(sessionId)
  if (!term) return false
  try {
    term.write(data)
    return true
  } catch {
    return false
  }
}

export function resizePtySession(sessionId, cols, rows) {
  const term = sessions.get(sessionId)
  if (!term) return false
  try {
    term.resize(Math.max(1, cols), Math.max(1, rows))
    return true
  } catch {
    return false
  }
}

export function killPtySession(sessionId) {
  const term = sessions.get(sessionId)
  if (!term) return
  try {
    term.kill()
  } catch {
    /* ignore */
  }
  sessions.delete(sessionId)
}

export function killAllPtySessions() {
  for (const id of [...sessions.keys()]) {
    killPtySession(id)
  }
}
