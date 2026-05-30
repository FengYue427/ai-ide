import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_CONTENT_LEN,
  MAX_WORKSPACE_FILES,
  sanitizeWorkspaceFilesForCloud,
  workspaceSanitizeHadOmissions,
} from './workspacePayload'

describe('sanitizeWorkspaceFilesForCloud', () => {
  it('keeps small text files', () => {
    const { files, summary } = sanitizeWorkspaceFilesForCloud([
      { name: 'index.ts', content: 'export {}' },
    ])
    expect(files).toHaveLength(1)
    expect(workspaceSanitizeHadOmissions(summary)).toBe(false)
  })

  it('omits binary extensions', () => {
    const { files, summary } = sanitizeWorkspaceFilesForCloud([
      { name: 'logo.png', content: 'x' },
      { name: 'app.ts', content: 'ok' },
    ])
    expect(files.map((f) => f.name)).toEqual(['app.ts'])
    expect(summary.omittedBinary).toBe(1)
  })

  it('omits oversized content', () => {
    const { files, summary } = sanitizeWorkspaceFilesForCloud([
      { name: 'big.txt', content: 'x'.repeat(MAX_FILE_CONTENT_LEN + 1) },
    ])
    expect(files).toHaveLength(0)
    expect(summary.omittedOversized).toBe(1)
  })

  it('caps file count', () => {
    const many = Array.from({ length: MAX_WORKSPACE_FILES + 5 }, (_, i) => ({
      name: `f${i}.ts`,
      content: 'a',
    }))
    const { files, summary } = sanitizeWorkspaceFilesForCloud(many)
    expect(files.length).toBe(MAX_WORKSPACE_FILES)
    expect(summary.droppedForCount).toBe(5)
  })
})
