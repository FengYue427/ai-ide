import { describe, expect, it } from 'vitest'
import { selectFilesForDefinitionSearch } from './selectFilesForDefinitionSearch'

function makeFiles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    name: `src/file-${String(index).padStart(3, '0')}.ts`,
    content: `export const v${index} = ${index}`,
  }))
}

describe('selectFilesForDefinitionSearch', () => {
  it('returns all files when under the cap', () => {
    const files = makeFiles(10)
    expect(selectFilesForDefinitionSearch(files, 'src/file-005.ts')).toHaveLength(10)
  })

  it('caps large workspaces and keeps the current file', () => {
    const files = makeFiles(200)
    const current = 'src/file-150.ts'
    const picked = selectFilesForDefinitionSearch(files, current, 120)

    expect(picked).toHaveLength(120)
    expect(picked.some((file) => file.name === current)).toBe(true)
  })

  it('prioritizes same-directory neighbors', () => {
    const files = [
      ...makeFiles(150),
      { name: 'src/active/dir/neighbor.ts', content: 'export const neighbor = 1' },
      { name: 'src/active/current.ts', content: 'export const current = 1' },
    ]
    const picked = selectFilesForDefinitionSearch(files, 'src/active/current.ts', 120)

    expect(picked.some((file) => file.name === 'src/active/current.ts')).toBe(true)
    expect(picked.some((file) => file.name === 'src/active/dir/neighbor.ts')).toBe(true)
  })
})
