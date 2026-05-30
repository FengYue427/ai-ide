import { describe, expect, it } from 'vitest'
import {
  detectCommandOutcome,
  normalizeNpmScriptLastRun,
  resultFromCommandOutcome,
} from './npmScriptRun'

describe('npmScriptRun', () => {
  it('normalizes persisted last run', () => {
    expect(normalizeNpmScriptLastRun({ name: 'test:unit', status: 'success', ranAt: 1 })).toEqual({
      name: 'test:unit',
      status: 'success',
      exitCode: undefined,
      ranAt: 1,
    })
    expect(normalizeNpmScriptLastRun({ name: '', status: 'error' })).toBeNull()
  })

  it('detects exit codes and npm errors', () => {
    expect(detectCommandOutcome(['done', '(exit 0)'])).toEqual({ exitCode: 0, failed: false })
    expect(detectCommandOutcome(['failed', '(exit 1)'])).toEqual({ exitCode: 1, failed: true })
    expect(detectCommandOutcome(['npm ERR! test failed'])).toEqual({ failed: true })
  })

  it('maps outcomes to run results', () => {
    expect(resultFromCommandOutcome('build', { exitCode: 0, failed: false }).status).toBe('success')
    expect(resultFromCommandOutcome('build', { exitCode: 2, failed: true }).status).toBe('error')
  })
})
