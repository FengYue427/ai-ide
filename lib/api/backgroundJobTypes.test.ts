import { afterEach, describe, expect, it } from 'vitest'
import {
  canCancelBackgroundJob,
  isBackgroundJobStatus,
  isJobRuntimeExpired,
  MAX_JOB_PROMPT_CHARS,
  MAX_JOB_RUNTIME_MS,
  normalizeJobListLimit,
  resolveBackgroundJobWorkerMode,
  validateCreateBackgroundJobInput,
} from './backgroundJobTypes'

describe('backgroundJobTypes', () => {
  it('validates create input', () => {
    expect(validateCreateBackgroundJobInput({ prompt: '  run tests  ' })).toBeNull()
    expect(validateCreateBackgroundJobInput({ prompt: '', repoKey: 'default' })).toBe(
      'api.job.promptRequired',
    )
    expect(
      validateCreateBackgroundJobInput({ prompt: 'x'.repeat(MAX_JOB_PROMPT_CHARS + 1) }),
    ).toBe('api.job.promptTooLong')
    expect(
      validateCreateBackgroundJobInput({ prompt: 'ok', repoKey: 'x'.repeat(300) }),
    ).toBe('api.job.repoKeyTooLong')
  })

  it('recognizes job statuses', () => {
    expect(isBackgroundJobStatus('queued')).toBe(true)
    expect(isBackgroundJobStatus('unknown')).toBe(false)
  })

  it('allows cancel only for queued or running', () => {
    expect(canCancelBackgroundJob('queued')).toBe(true)
    expect(canCancelBackgroundJob('running')).toBe(true)
    expect(canCancelBackgroundJob('succeeded')).toBe(false)
    expect(canCancelBackgroundJob('cancelled')).toBe(false)
  })

  it('normalizes list limit', () => {
    expect(normalizeJobListLimit(undefined)).toBe(50)
    expect(normalizeJobListLimit(0)).toBe(1)
    expect(normalizeJobListLimit(999)).toBe(100)
    expect(normalizeJobListLimit(20)).toBe(20)
  })

  it('detects expired runtime', () => {
    const old = new Date(Date.now() - MAX_JOB_RUNTIME_MS - 1000)
    expect(isJobRuntimeExpired(old)).toBe(true)
    expect(isJobRuntimeExpired(new Date())).toBe(false)
  })
})

describe('resolveBackgroundJobWorkerMode', () => {
  afterEach(() => {
    delete process.env.BACKGROUND_JOB_WORKER_MODE
  })

  it('defaults to dummy', () => {
    expect(resolveBackgroundJobWorkerMode()).toBe('dummy')
  })

  it('supports agent when configured', () => {
    process.env.BACKGROUND_JOB_WORKER_MODE = 'agent'
    expect(resolveBackgroundJobWorkerMode()).toBe('agent')
  })
})
