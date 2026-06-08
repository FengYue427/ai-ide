import type { TranslationKey } from '../i18n'

const GIT_ERROR_MAP: Record<string, TranslationKey> = {
  'Invalid branch name': 'git.branchNameInvalid',
  'Branch already exists': 'git.branchExists',
  'No hunks selected': 'git.error.noHunksSelected',
}

const STAGED_DIFF_PREFIX = 'Staged diff unavailable for '

/** Map legacy English service errors to localized UI strings. */
export function formatUserError(
  message: string,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  const mapped = GIT_ERROR_MAP[message]
  if (mapped) return t(mapped)

  if (message.startsWith(STAGED_DIFF_PREFIX)) {
    const path = message.slice(STAGED_DIFF_PREFIX.length)
    return t('git.error.stagedDiffUnavailable', { path })
  }

  return message
}
