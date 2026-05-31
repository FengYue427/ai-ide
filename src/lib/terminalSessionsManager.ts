/** Multi-session terminal buffers (v1.1.5.4). */

export const TERMINAL_SESSIONS_META_KEY = 'terminal-sessions-meta'
export const TERMINAL_MAX_SESSIONS = 4
export const TERMINAL_MAX_BUFFER_LINES = 2000
export const DEFAULT_TERMINAL_SESSION_ID = 'main'

export type TerminalSessionMeta = {
  id: string
  label: string
}

export type TerminalSessionsMetaPrefs = {
  activeId: string
  sessions: TerminalSessionMeta[]
}

type SessionRecord = {
  id: string
  label: string
  outputLines: string[]
  pendingChunks: string
}

const sessions = new Map<string, SessionRecord>()
let activeSessionId = DEFAULT_TERMINAL_SESSION_ID
let sessionCounter = 1

function ensureDefaultSession(): SessionRecord {
  let record = sessions.get(DEFAULT_TERMINAL_SESSION_ID)
  if (!record) {
    record = { id: DEFAULT_TERMINAL_SESSION_ID, label: '1', outputLines: [], pendingChunks: '' }
    sessions.set(DEFAULT_TERMINAL_SESSION_ID, record)
  }
  return record
}

export function initTerminalSessions(meta?: TerminalSessionsMetaPrefs | null): void {
  sessions.clear()
  sessionCounter = 1
  if (meta?.sessions?.length) {
    for (const item of meta.sessions.slice(0, TERMINAL_MAX_SESSIONS)) {
      sessions.set(item.id, {
        id: item.id,
        label: item.label,
        outputLines: [],
        pendingChunks: '',
      })
      const num = Number.parseInt(item.label, 10)
      if (Number.isFinite(num)) sessionCounter = Math.max(sessionCounter, num)
    }
    activeSessionId = meta.activeId && sessions.has(meta.activeId)
      ? meta.activeId
      : meta.sessions[0].id
  } else {
    ensureDefaultSession()
    activeSessionId = DEFAULT_TERMINAL_SESSION_ID
  }
  ensureDefaultSession()
}

export function getActiveTerminalSessionId(): string {
  return activeSessionId
}

export function listTerminalSessionMeta(): TerminalSessionMeta[] {
  return [...sessions.values()].map((s) => ({ id: s.id, label: s.label }))
}

export function getTerminalSessionsMetaPrefs(): TerminalSessionsMetaPrefs {
  return {
    activeId: activeSessionId,
    sessions: listTerminalSessionMeta(),
  }
}

function getActiveRecord(): SessionRecord {
  return sessions.get(activeSessionId) ?? ensureDefaultSession()
}

export function appendToActiveSession(data: string): void {
  if (!data) return
  const record = getActiveRecord()

  record.pendingChunks += data
  const parts = record.pendingChunks.split(/\r?\n/)
  record.pendingChunks = parts.pop() ?? ''
  for (const part of parts) {
    if (part.length > 0) record.outputLines.push(part)
  }
  if (record.outputLines.length > TERMINAL_MAX_BUFFER_LINES) {
    record.outputLines.splice(0, record.outputLines.length - TERMINAL_MAX_BUFFER_LINES)
  }
}

export function clearActiveSessionBuffer(): void {
  const record = getActiveRecord()
  record.outputLines.length = 0
  record.pendingChunks = ''
}

export function getActiveSessionOutputLines(): string[] {
  const record = getActiveRecord()
  const tail = record.pendingChunks.trim()
  return tail ? [...record.outputLines, tail] : [...record.outputLines]
}

/** Replay text for xterm after switching sessions. */
export function formatSessionReplay(record: SessionRecord): string {
  const lines = record.pendingChunks.trim()
    ? [...record.outputLines, record.pendingChunks.trim()]
    : [...record.outputLines]
  if (lines.length === 0) return ''
  return `${lines.join('\r\n')}\r\n`
}

export function createTerminalSession(): TerminalSessionMeta | null {
  if (sessions.size >= TERMINAL_MAX_SESSIONS) return null
  sessionCounter += 1
  const id = `term-${Date.now()}-${sessionCounter}`
  const label = String(sessionCounter)
  const record: SessionRecord = { id, label, outputLines: [], pendingChunks: '' }
  sessions.set(id, record)
  return { id, label }
}

export function closeTerminalSession(id: string): boolean {
  if (id === DEFAULT_TERMINAL_SESSION_ID) return false
  if (!sessions.has(id)) return false
  sessions.delete(id)
  if (activeSessionId === id) {
    activeSessionId = DEFAULT_TERMINAL_SESSION_ID
    ensureDefaultSession()
  }
  return true
}

export function switchTerminalSession(id: string): string {
  if (!sessions.has(id)) return ''
  activeSessionId = id
  return formatSessionReplay(sessions.get(id)!)
}

export function normalizeTerminalSessionsMetaPrefs(raw: unknown): TerminalSessionsMetaPrefs | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const sessionsRaw = Array.isArray(record.sessions) ? record.sessions : []
  const sessions: TerminalSessionMeta[] = []
  for (const item of sessionsRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id : ''
    const label = typeof row.label === 'string' ? row.label : ''
    if (id && label) sessions.push({ id, label })
  }
  if (sessions.length === 0) return null
  const activeId = typeof record.activeId === 'string' ? record.activeId : sessions[0].id
  return { activeId, sessions: sessions.slice(0, TERMINAL_MAX_SESSIONS) }
}
