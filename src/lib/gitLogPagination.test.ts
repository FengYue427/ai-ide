import { describe, expect, it } from 'vitest'
import {
  getLogContinueRef,
  gitLogHasMore,
  mergeGitLogPages,
} from './gitLogPagination'
import type { GitCommit } from '../services/gitService'

function commit(oid: string, parent?: string): GitCommit {
  return {
    oid,
    commit: {
      message: oid,
      author: { name: 'a', email: 'a@x', timestamp: 0 },
      parent: parent ? [parent] : [],
    },
  }
}

describe('gitLogPagination', () => {
  it('returns parent oid for continue ref', () => {
    expect(getLogContinueRef([commit('c2', 'c1')])).toBe('c1')
    expect(getLogContinueRef([commit('root')])).toBeNull()
  })

  it('detects when more history exists', () => {
    expect(gitLogHasMore([commit('c2', 'c1')])).toBe(true)
    expect(gitLogHasMore([commit('root')])).toBe(false)
  })

  it('merges pages without duplicate oids', () => {
    const first = [commit('c2', 'c1'), commit('c1', 'c0')]
    const second = [commit('c1', 'c0'), commit('c0')]
    expect(mergeGitLogPages(first, second).map((c) => c.oid)).toEqual(['c2', 'c1', 'c0'])
  })
})
