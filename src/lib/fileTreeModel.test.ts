import { describe, expect, it, vi } from 'vitest'
import { buildFileTree, collectFolderPaths, flattenVisibleFileTree } from './fileTreeModel'
import { shouldUseVirtualFileTree } from './v12Features'

describe('fileTreeModel', () => {
  it('builds nested folders and flattens expanded paths', () => {
    const tree = buildFileTree([
      { file: { name: 'src/a.ts' }, index: 0 },
      { file: { name: 'src/b.ts' }, index: 1 },
    ])
    const rows = flattenVisibleFileTree(tree, new Set(['src']))
    expect(rows.some((r) => r.kind === 'folder' && r.path === 'src')).toBe(true)
    expect(rows.filter((r) => r.kind === 'file')).toHaveLength(2)
  })

  it('flattens large file lists for virtual tree threshold', () => {
    const entries = Array.from({ length: 520 }, (_, i) => ({
      file: { name: `file-${i}.ts` },
      index: i,
    }))
    const tree = buildFileTree(entries)
    const collapsed = flattenVisibleFileTree(tree, new Set())
    expect(collapsed.length).toBe(520)
    const nested = Array.from({ length: 100 }, (_, i) => ({
      file: { name: `src/pkg/file-${i}.ts` },
      index: i,
    }))
    const nestedTree = buildFileTree(nested)
    const expanded = new Set(collectFolderPaths(nestedTree))
    expect(flattenVisibleFileTree(nestedTree, expanded).length).toBeGreaterThanOrEqual(100)
  })
})

describe('v12 virtual tree threshold', () => {
  it('uses 500 row threshold when virtual tree enabled', () => {
    vi.stubEnv('MODE', 'test')
    vi.stubEnv('VITE_MULTI_ROOT', 'false')
    vi.stubEnv('VITE_VIRTUAL_FILE_TREE', 'true')
    expect(shouldUseVirtualFileTree(499)).toBe(false)
    expect(shouldUseVirtualFileTree(500)).toBe(true)
    vi.unstubAllEnvs()
  })
})
