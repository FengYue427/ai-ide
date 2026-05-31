import type { GitCommit, GitCommitFileChange } from '../services/gitService'

export function normalizeGitHistoryFilterQuery(query: string): string {
  return query.trim().toLowerCase()
}

/** Match commit against filter query (message, author, oid, optional loaded paths). */
export function gitCommitMatchesHistoryFilter(
  commit: GitCommit,
  query: string,
  changedFiles?: GitCommitFileChange[],
): boolean {
  const q = normalizeGitHistoryFilterQuery(query)
  if (!q) return true

  const message = commit.commit.message.toLowerCase()
  const authorName = commit.commit.author.name.toLowerCase()
  const authorEmail = commit.commit.author.email.toLowerCase()
  const oid = commit.oid.toLowerCase()

  if (message.includes(q) || authorName.includes(q) || authorEmail.includes(q)) {
    return true
  }

  if (oid.startsWith(q) || oid.includes(q)) {
    return true
  }

  if (changedFiles?.some((file) => file.filepath.toLowerCase().includes(q))) {
    return true
  }

  return false
}

export function filterGitCommitsByHistoryQuery(
  commits: GitCommit[],
  query: string,
  commitFilesByOid: Record<string, GitCommitFileChange[]> = {},
): GitCommit[] {
  const q = normalizeGitHistoryFilterQuery(query)
  if (!q) return commits

  return commits.filter((commit) =>
    gitCommitMatchesHistoryFilter(commit, q, commitFilesByOid[commit.oid]),
  )
}

export function isGitHistoryFilterActive(query: string): boolean {
  return normalizeGitHistoryFilterQuery(query).length > 0
}
