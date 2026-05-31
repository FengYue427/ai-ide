import type { GitCommit } from '../services/gitService'

/** Default page size for Git history (matches v1.1.6 pre-pagination depth). */
export const GIT_LOG_PAGE_SIZE = 50

/** OID of the next older commit to fetch, or null when history ends. */
export function getLogContinueRef(commits: GitCommit[]): string | null {
  if (commits.length === 0) return null
  const last = commits[commits.length - 1]
  return last.commit.parent?.[0] ?? null
}

export function gitLogHasMore(commits: GitCommit[]): boolean {
  return getLogContinueRef(commits) !== null
}

/** Append a log page without duplicating the boundary commit. */
export function mergeGitLogPages(existing: GitCommit[], nextPage: GitCommit[]): GitCommit[] {
  if (nextPage.length === 0) return existing
  const seen = new Set(existing.map((commit) => commit.oid))
  const appended = nextPage.filter((commit) => !seen.has(commit.oid))
  return [...existing, ...appended]
}
