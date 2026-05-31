import { describe, expect, it, vi, beforeEach } from 'vitest'
import { stageAllInWorkspace } from './gitQuickActions'

const getStatus = vi.fn()
const stageAllUnstaged = vi.fn()

vi.mock('../services/gitService', () => ({
  getStatus: (...args: unknown[]) => getStatus(...args),
  stageAllUnstaged: (...args: unknown[]) => stageAllUnstaged(...args),
}))

describe('stageAllInWorkspace', () => {
  beforeEach(() => {
    getStatus.mockReset()
    stageAllUnstaged.mockReset()
  })

  it('syncs files then stages all unstaged paths', async () => {
    const writes: Array<[string, string]> = []
    const fs = {
      writeFile: vi.fn(async (path: string, content: string) => {
        writes.push([path, content])
      }),
    }

    getStatus.mockResolvedValue([
      { filepath: 'a.ts', staged: false, status: 'modified' },
      { filepath: 'b.ts', staged: true, status: 'modified' },
    ])
    stageAllUnstaged.mockResolvedValue(1)

    const result = await stageAllInWorkspace({
      fs,
      files: [{ name: 'a.ts', content: 'a', language: 'typescript' }],
    })

    expect(writes).toEqual([['a.ts', 'a']])
    expect(stageAllUnstaged).toHaveBeenCalledWith(fs, '/', [
      { filepath: 'a.ts', staged: false, status: 'modified' },
      { filepath: 'b.ts', staged: true, status: 'modified' },
    ])
    expect(result).toEqual({ stagedCount: 1, unstagedCount: 1 })
  })
})
