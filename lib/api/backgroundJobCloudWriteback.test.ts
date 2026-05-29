import { describe, expect, it } from 'vitest'
import {
  mergePendingChangesIntoWorkspaceFiles,
  parseWorkspaceFilesJson,
} from './backgroundJobCloudWriteback'

describe('backgroundJobCloudWriteback', () => {
  it('parses workspace files JSON', () => {
    const files = parseWorkspaceFilesJson(
      JSON.stringify([{ name: 'a.js', content: '1', language: 'javascript' }]),
    )
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('a.js')
  })

  it('merges pending changes by path', () => {
    const merged = mergePendingChangesIntoWorkspaceFiles(
      [{ name: 'a.js', content: 'old' }],
      [{ path: 'a.js', content: 'new', language: 'javascript' }, { path: 'b.ts', content: 'x' }],
    )
    expect(merged.find((f) => f.name === 'a.js')?.content).toBe('new')
    expect(merged.find((f) => f.name === 'b.ts')?.content).toBe('x')
  })
})
