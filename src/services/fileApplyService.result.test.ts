import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyChangesWithResult } from './fileApplyService'

const mockUpdate = vi.fn()
const mockAdd = vi.fn()
const mockGet = vi.fn()
const mockWrite = vi.fn()

vi.mock('./workspaceContextService', () => ({
  workspaceContextService: {
    getFile: (...args: unknown[]) => mockGet(...args),
    updateFile: (...args: unknown[]) => mockUpdate(...args),
    addFile: (...args: unknown[]) => mockAdd(...args),
  },
}))

vi.mock('./semanticSearchService', () => ({
  clearSemanticSearchCache: vi.fn(),
}))

vi.mock('./localProjectService', () => ({
  localProjectService: {
    isBound: () => true,
    writeFile: (...args: unknown[]) => mockWrite(...args),
  },
}))

vi.mock('./localProjectPaths', () => ({
  normalizeProjectPath: (path: string) => path,
}))

describe('applyChangesWithResult', () => {
  beforeEach(() => {
    mockUpdate.mockReset()
    mockAdd.mockReset()
    mockGet.mockReset()
    mockWrite.mockReset()
    mockUpdate.mockResolvedValue(undefined)
    mockAdd.mockResolvedValue(undefined)
    mockWrite.mockResolvedValue(undefined)
  })

  it('returns ok when all files apply', async () => {
    mockGet.mockReturnValue({ path: 'src/a.ts', content: 'old' })
    const result = await applyChangesWithResult([
      { path: 'src/a.ts', content: 'new', language: 'typescript' },
    ])
    expect(result.ok).toBe(true)
    expect(result.applied).toBe(1)
    expect(result.failures).toHaveLength(0)
  })

  it('reports disk write failures', async () => {
    mockGet.mockReturnValue({ path: 'src/a.ts', content: 'old' })
    mockWrite.mockRejectedValueOnce(new Error('disk full'))
    const result = await applyChangesWithResult([
      { path: 'src/a.ts', content: 'new', language: 'typescript' },
    ])
    expect(result.ok).toBe(false)
    expect(result.applied).toBe(0)
    expect(result.failures[0]).toEqual({ path: 'src/a.ts', reason: 'disk full' })
  })
})
