import type { GitStatus } from '../services/gitService'

/** isomorphic-git statusMatrix column indices. */
export const STATUS_FILE = 0
export const STATUS_HEAD = 1
export const STATUS_WORKDIR = 2
export const STATUS_STAGE = 3

export type StatusMatrixHead = 0 | 1
export type StatusMatrixWorkdir = 0 | 1 | 2
export type StatusMatrixStage = 0 | 1 | 2 | 3
export type StatusMatrixRow = [
  string,
  StatusMatrixHead,
  StatusMatrixWorkdir,
  StatusMatrixStage,
]

/** HEAD index differs from STAGE index → staged for commit. */
export function isStagedStatusRow(row: StatusMatrixRow): boolean {
  return row[STATUS_HEAD] !== row[STATUS_STAGE]
}

/**
 * Map one statusMatrix row to GitStatus (null = unmodified, omit from list).
 * See isomorphic-git statusMatrix docs for HEAD/WORKDIR/STAGE semantics.
 */
export function mapStatusMatrixRow(row: StatusMatrixRow): GitStatus | null {
  const filepath = row[STATUS_FILE]
  const head = row[STATUS_HEAD]
  const workdir = row[STATUS_WORKDIR]
  const stage = row[STATUS_STAGE]

  if (head === 1 && workdir === 1 && stage === 1) {
    return null
  }

  const staged = isStagedStatusRow(row)
  let status: GitStatus['status']

  if (head === 0 && workdir === 2 && stage === 0) {
    status = 'untracked'
  } else if (head === 0 && workdir === 2) {
    status = 'added'
  } else if (head === 1 && workdir === 0) {
    status = 'deleted'
  } else if (head === 1 && workdir === 2) {
    status = 'modified'
  } else if (head === 0 && workdir === 0 && stage !== 0) {
    status = 'added'
  } else {
    status = 'modified'
  }

  return { filepath, staged, status }
}

export function normalizeGitPath(filepath: string): string {
  return filepath.replace(/^\.\//, '').replace(/^\/+/, '')
}

/** True when statusMatrix indicates a staged change exists for this path. */
export function rowHasStagedChange(row: StatusMatrixRow): boolean {
  return isStagedStatusRow(row)
}
