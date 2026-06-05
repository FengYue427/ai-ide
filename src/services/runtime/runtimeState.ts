/** v1.4.7 — runtime-state.json parse/validate (read-only). See ADR D5. */

export const RUNTIME_STATE_PATH = '.aide/meta/runtime-state.json'

export const HOOK_RESULT_STATUSES = ['ok', 'fail', 'skip', 'running'] as const
export type HookResultStatus = (typeof HOOK_RESULT_STATUSES)[number]

export interface RuntimeHookResult {
  hookId: string
  at: string
  status: HookResultStatus
  specPath?: string
}

export interface RuntimeQueueSnapshot {
  specPending: number
  planPending: number
}

export interface RuntimeStateDocument {
  version: 1
  activeSpecPath?: string
  queueSnapshot?: RuntimeQueueSnapshot
  lastHookResults?: RuntimeHookResult[]
  updatedAt?: string
}

export interface RuntimeStateParseResult {
  ok: boolean
  document?: RuntimeStateDocument
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHookResultStatus(value: unknown): value is HookResultStatus {
  return typeof value === 'string' && HOOK_RESULT_STATUSES.includes(value as HookResultStatus)
}

function parseHookResult(value: unknown, _index: number): RuntimeHookResult | null {
  if (!isRecord(value)) {
    return null
  }
  const hookId = typeof value.hookId === 'string' ? value.hookId.trim() : ''
  const at = typeof value.at === 'string' ? value.at.trim() : ''
  const status = value.status
  if (!hookId) return null
  if (!at) return null
  if (!isHookResultStatus(status)) return null

  const result: RuntimeHookResult = { hookId, at, status }
  if (typeof value.specPath === 'string' && value.specPath.trim()) {
    result.specPath = value.specPath.trim()
  }
  return result
}

export function parseRuntimeStateJson(content: string): RuntimeStateParseResult {
  const errors: string[] = []
  const trimmed = content.trim()
  if (!trimmed) {
    return { ok: false, errors: ['runtime-state.json is empty'] }
  }

  let raw: unknown
  try {
    raw = JSON.parse(trimmed)
  } catch {
    return { ok: false, errors: ['invalid JSON'] }
  }

  if (!isRecord(raw)) {
    return { ok: false, errors: ['root must be an object'] }
  }

  const version = raw.version
  if (version !== 1) {
    errors.push(`unsupported version: ${String(version)}`)
  }

  let activeSpecPath: string | undefined
  if (raw.activeSpecPath != null) {
    if (typeof raw.activeSpecPath !== 'string' || !raw.activeSpecPath.trim()) {
      errors.push('activeSpecPath must be a non-empty string')
    } else {
      activeSpecPath = raw.activeSpecPath.trim()
    }
  }

  let queueSnapshot: RuntimeQueueSnapshot | undefined
  if (raw.queueSnapshot != null) {
    if (!isRecord(raw.queueSnapshot)) {
      errors.push('queueSnapshot must be an object')
    } else {
      const specPending = raw.queueSnapshot.specPending
      const planPending = raw.queueSnapshot.planPending
      if (typeof specPending !== 'number' || !Number.isFinite(specPending) || specPending < 0) {
        errors.push('queueSnapshot.specPending must be a non-negative number')
      } else if (typeof planPending !== 'number' || !Number.isFinite(planPending) || planPending < 0) {
        errors.push('queueSnapshot.planPending must be a non-negative number')
      } else {
        queueSnapshot = { specPending, planPending }
      }
    }
  }

  const lastHookResults: RuntimeHookResult[] = []
  if (raw.lastHookResults != null) {
    if (!Array.isArray(raw.lastHookResults)) {
      errors.push('lastHookResults must be an array')
    } else {
      raw.lastHookResults.forEach((item, index) => {
        const parsed = parseHookResult(item, index)
        if (!parsed) {
          errors.push(`lastHookResults[${index}]: invalid entry`)
          return
        }
        lastHookResults.push(parsed)
      })
    }
  }

  let updatedAt: string | undefined
  if (raw.updatedAt != null) {
    if (typeof raw.updatedAt !== 'string' || !raw.updatedAt.trim()) {
      errors.push('updatedAt must be a non-empty string')
    } else {
      updatedAt = raw.updatedAt.trim()
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    document: {
      version: 1,
      activeSpecPath,
      queueSnapshot,
      lastHookResults: lastHookResults.length > 0 ? lastHookResults : undefined,
      updatedAt,
    },
    errors: [],
  }
}

export function specNameFromTasksPath(tasksPath: string): string {
  const match = tasksPath.match(/^\.aide\/specs\/([^/]+)\/tasks\.md$/i)
  return match?.[1] ?? tasksPath
}

export function formatRuntimeStateSummaryLines(document: RuntimeStateDocument): string[] {
  const lines: string[] = []
  if (document.activeSpecPath) {
    lines.push(`active: ${specNameFromTasksPath(document.activeSpecPath)}`)
  }
  if (document.queueSnapshot) {
    const { specPending, planPending } = document.queueSnapshot
    lines.push(`queue: spec ${specPending} · plan ${planPending}`)
  }
  const lastHook = document.lastHookResults?.[document.lastHookResults.length - 1]
  if (lastHook) {
    lines.push(`hook: ${lastHook.hookId} · ${lastHook.status}`)
  }
  if (document.updatedAt) {
    lines.push(`updated: ${document.updatedAt}`)
  }
  return lines
}

export type SpecExecutionStatus = 'active' | 'completed' | 'in-progress' | 'idle'

export function deriveSpecExecutionStatus(
  tasksPath: string,
  uncheckedTasks: number,
  totalTasks: number,
  lastExecutedAt: string | null,
  activeSpecPath?: string | null,
): SpecExecutionStatus {
  if (activeSpecPath && tasksPath === activeSpecPath) return 'active'
  if (totalTasks > 0 && uncheckedTasks === 0) return 'completed'
  if (lastExecutedAt) return 'in-progress'
  return 'idle'
}
