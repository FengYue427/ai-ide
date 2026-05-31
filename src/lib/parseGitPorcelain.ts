import type { GitStatus } from '../services/gitService'
import { normalizeGitPath } from './gitStatusMatrix'

/** Parse `git status --porcelain=v1 -z` output into GitStatus rows (v1.1.6.8). */
export function parseGitPorcelainZ(raw: string): GitStatus[] {
  if (!raw) return []

  const tokens = raw.split('\0').filter((token) => token.length > 0)
  const results: GitStatus[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const entry = tokens[index]
    if (entry.length < 3) continue

    const indexStatus = entry[0] ?? ' '
    const worktreeStatus = entry[1] ?? ' '
    let path = entry.slice(3)

    if (indexStatus === 'R' || indexStatus === 'C') {
      const renamedPath = tokens[index + 1]
      if (renamedPath) {
        path = renamedPath
        index += 1
      }
    }

    const filepath = normalizeGitPath(path)
    if (!filepath) continue

    const stagedStatus = porcelainCharToGitStatus(indexStatus, true)
    if (stagedStatus && indexStatus !== '?' && indexStatus !== '!') {
      results.push({ filepath, staged: true, status: stagedStatus })
    }

    const unstagedStatus = porcelainCharToGitStatus(worktreeStatus, false)
    if (unstagedStatus) {
      results.push({ filepath, staged: false, status: unstagedStatus })
    }
  }

  return results
}

function porcelainCharToGitStatus(char: string, staged: boolean): GitStatus['status'] | null {
  if (char === ' ' || char === '!') return null
  if (char === '?') return staged ? null : 'untracked'
  if (char === 'D') return 'deleted'
  if (char === 'A') return 'added'
  if (char === 'U') return 'modified'
  if (char === 'M' || char === 'R' || char === 'C') return 'modified'
  return 'modified'
}
