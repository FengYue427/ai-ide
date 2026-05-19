import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyChangesToWorkspace } from './fileApplyService'

const mockUpdate = vi.fn()
const mockAdd = vi.fn()
const mockGet = vi.fn()

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

describe('applyChangesToWorkspace', () => {
  beforeEach(() => {
    mockUpdate.mockReset()
    mockAdd.mockReset()
    mockGet.mockReset()
  })

  it('updates existing workspace files', async () => {
    mockGet.mockReturnValue({ path: 'src/a.ts', content: 'old' })

    await applyChangesToWorkspace([
      { path: 'src/a.ts', content: 'new', language: 'typescript' },
    ])

    expect(mockUpdate).toHaveBeenCalledWith('src/a.ts', 'new')
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('adds new workspace files', async () => {
    mockGet.mockReturnValue(undefined)

    await applyChangesToWorkspace([
      { path: 'src/new.ts', content: 'body', language: 'typescript' },
    ])

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'src/new.ts', content: 'body' }),
    )
  })
})
