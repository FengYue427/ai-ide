import { describe, expect, it } from 'vitest'
import { buildFileTree, flattenVisibleFileTree } from './fileTreeModel'

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
})
