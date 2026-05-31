import { describe, expect, it } from 'vitest'
import {
  filterGitCommitsByHistoryQuery,
  gitCommitMatchesHistoryFilter,
  isGitHistoryFilterActive,
} from './gitHistoryFilter'
import type { GitCommit } from '../services/gitService'

function commit(
  oid: string,
  message: string,
  author = 'Alice',
): GitCommit {
  return {
    oid,
    commit: {
      message,
      author: { name: author, email: 'alice@example.com', timestamp: 0 },
      parent: [],
    },
  }
}

describe('gitHistoryFilter', () => {
  const commits = [
    commit('abc123def', 'fix: login bug', 'Alice'),
    commit('def456ghi', 'feat: add panel', 'Bob'),
  ]

  it('returns all commits when query is empty', () => {
    expect(filterGitCommitsByHistoryQuery(commits, '')).toHaveLength(2)
    expect(isGitHistoryFilterActive('  ')).toBe(false)
  })

  it('filters by message and author', () => {
    expect(filterGitCommitsByHistoryQuery(commits, 'login')).toHaveLength(1)
    expect(filterGitCommitsByHistoryQuery(commits, 'bob')).toHaveLength(1)
  })

  it('filters by oid prefix', () => {
    expect(filterGitCommitsByHistoryQuery(commits, 'def456')).toHaveLength(1)
  })

  it('matches filepath when commit files are loaded', () => {
    const files = { 'abc123def': [{ filepath: 'src/auth/login.ts', status: 'modified' as const }] }
    expect(filterGitCommitsByHistoryQuery(commits, 'auth/login', files)).toHaveLength(1)
    expect(gitCommitMatchesHistoryFilter(commits[1]!, 'auth/login', undefined)).toBe(false)
  })
})
