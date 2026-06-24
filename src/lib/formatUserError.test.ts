import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n'
import { formatUserError } from './formatUserError'

describe('formatUserError', () => {
  it('maps legacy git errors to zh-CN', () => {
    const t = createTranslator('zh-CN')
    expect(formatUserError('Invalid branch name', t)).toBe(t('git.branchNameInvalid'))
    expect(formatUserError('Branch already exists', t)).toBe(t('git.branchExists'))
    expect(formatUserError('No hunks selected', t)).toBe(t('git.error.noHunksSelected'))
    expect(formatUserError('Staged diff unavailable for src/foo.ts', t)).toBe(
      t('git.error.stagedDiffUnavailable', { path: 'src/foo.ts' }),
    )
  })

  it('passes through unknown messages', () => {
    const t = createTranslator('en-US')
    expect(formatUserError('Something else', t)).toBe('Something else')
  })

  it('maps desktop project binding errors', () => {
    const t = (key: string) => key
    expect(formatUserError('DESKTOP_PROJECT_NOT_BOUND', t)).toBe('git.error.desktopProjectNotBound')
    expect(formatUserError('GIT_FS_UNAVAILABLE', t)).toBe('git.error.fsUnavailable')
  })
})
