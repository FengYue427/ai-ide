import { describe, expect, it } from 'vitest'
import {
  deriveSpecExecutionStatus,
  formatRuntimeStateSummaryLines,
  parseRuntimeStateJson,
  RUNTIME_STATE_PATH,
  specNameFromTasksPath,
} from './runtimeState'

const SAMPLE = `{
  "version": 1,
  "activeSpecPath": ".aide/specs/auth-login/tasks.md",
  "queueSnapshot": { "specPending": 2, "planPending": 0 },
  "lastHookResults": [
    { "hookId": "pre-run-tests", "at": "2026-06-05T10:00:00Z", "status": "ok" }
  ],
  "updatedAt": "2026-06-05T10:00:05Z"
}`

describe('runtimeState', () => {
  it('exposes canonical path', () => {
    expect(RUNTIME_STATE_PATH).toBe('.aide/meta/runtime-state.json')
  })

  it('parses valid runtime-state.json', () => {
    const result = parseRuntimeStateJson(SAMPLE)
    expect(result.ok).toBe(true)
    expect(result.document?.activeSpecPath).toContain('auth-login')
    expect(result.document?.queueSnapshot?.specPending).toBe(2)
    expect(result.document?.lastHookResults).toHaveLength(1)
  })

  it('rejects unsupported version', () => {
    const result = parseRuntimeStateJson('{"version": 2}')
    expect(result.ok).toBe(false)
  })

  it('rejects invalid hook status', () => {
    const result = parseRuntimeStateJson(`{
      "version": 1,
      "lastHookResults": [{ "hookId": "x", "at": "t", "status": "boom" }]
    }`)
    expect(result.ok).toBe(false)
  })

  it('formats summary lines', () => {
    const parsed = parseRuntimeStateJson(SAMPLE)
    expect(parsed.document).toBeDefined()
    const lines = formatRuntimeStateSummaryLines(parsed.document!)
    expect(lines.some((l) => l.includes('auth-login'))).toBe(true)
    expect(lines.some((l) => l.includes('spec 2'))).toBe(true)
    expect(lines.some((l) => l.includes('pre-run-tests'))).toBe(true)
  })

  it('derives spec execution status', () => {
    const path = '.aide/specs/auth/tasks.md'
    expect(deriveSpecExecutionStatus(path, 1, 2, null, path)).toBe('active')
    expect(deriveSpecExecutionStatus(path, 0, 2, null, null)).toBe('completed')
    expect(deriveSpecExecutionStatus(path, 1, 2, '2026-06-05', null)).toBe('in-progress')
    expect(deriveSpecExecutionStatus(path, 2, 2, null, null)).toBe('idle')
  })

  it('extracts spec name from tasks path', () => {
    expect(specNameFromTasksPath('.aide/specs/auth-login/tasks.md')).toBe('auth-login')
  })
})
