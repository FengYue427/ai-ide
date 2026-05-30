export const NPM_SCRIPTS_LAST_RUN_KEY = 'npm-scripts-last-run'

export type NpmScriptLastRunStatus = 'success' | 'error' | 'running'

export type NpmScriptLastRun = {
  name: string
  status: NpmScriptLastRunStatus
  exitCode?: number
  ranAt: number
}

export type NpmScriptRunResult = {
  scriptName: string
  status: 'success' | 'error' | 'skipped'
  exitCode?: number
  detail?: string
}

export type RunNpmScriptHandler = (scriptName: string) => void | Promise<void | NpmScriptRunResult>

const VALID_STATUSES = new Set<NpmScriptLastRunStatus>(['success', 'error', 'running'])

export function normalizeNpmScriptLastRun(raw: unknown): NpmScriptLastRun | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!name) return null
  const status = typeof record.status === 'string' && VALID_STATUSES.has(record.status as NpmScriptLastRunStatus)
    ? (record.status as NpmScriptLastRunStatus)
    : 'success'
  const exitCode = typeof record.exitCode === 'number' && Number.isFinite(record.exitCode)
    ? Math.floor(record.exitCode)
    : undefined
  const ranAt = typeof record.ranAt === 'number' && Number.isFinite(record.ranAt)
    ? record.ranAt
    : Date.now()
  return { name, status, exitCode, ranAt }
}

export function detectCommandOutcome(newLines: string[]): { exitCode?: number; failed: boolean } {
  for (let i = newLines.length - 1; i >= 0; i -= 1) {
    const exitMatch = newLines[i].match(/\(exit (\d+)\)/)
    if (exitMatch) {
      const exitCode = Number(exitMatch[1])
      return { exitCode, failed: exitCode !== 0 }
    }
  }

  const joined = newLines.join('\n').toLowerCase()
  if (joined.includes('npm err!') || joined.includes('elifecycle') || joined.includes('command failed')) {
    return { failed: true }
  }

  return { failed: false }
}

export function resultFromCommandOutcome(
  scriptName: string,
  outcome: { exitCode?: number; failed: boolean },
  detail?: string,
): NpmScriptRunResult {
  if (outcome.failed || (outcome.exitCode !== undefined && outcome.exitCode !== 0)) {
    return {
      scriptName,
      status: 'error',
      exitCode: outcome.exitCode,
      detail,
    }
  }
  return {
    scriptName,
    status: 'success',
    exitCode: outcome.exitCode ?? 0,
    detail,
  }
}
