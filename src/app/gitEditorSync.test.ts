import { describe, expect, it } from 'vitest'
import { applyGitSyncToFiles } from './gitEditorSync'

describe('applyGitSyncToFiles', () => {
  it('updates and removes editor tabs from git sync', () => {
    const files = [
      { name: 'a.ts', content: 'old', language: 'typescript' },
      { name: 'b.ts', content: 'keep', language: 'typescript' },
    ]
    const next = applyGitSyncToFiles(files, [
      { path: 'a.ts', content: 'restored' },
      { path: 'b.ts', content: null },
    ])
    expect(next).toHaveLength(1)
    expect(next[0]?.name).toBe('a.ts')
    expect(next[0]?.content).toBe('restored')
  })
})
