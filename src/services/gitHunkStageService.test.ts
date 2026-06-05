import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadWorkdirHunkPreview, stageWorkdirHunks } from './gitHunkStageService'

const getFileDiff = vi.fn()
const stageFile = vi.fn()

vi.mock('./gitService', () => ({
  getFileDiff: (...args: unknown[]) => getFileDiff(...args),
  stageFile: (...args: unknown[]) => stageFile(...args),
}))

describe('gitHunkStageService', () => {
  beforeEach(() => {
    getFileDiff.mockReset()
    stageFile.mockReset()
  })

  it('loads grouped hunks from workdir diff', async () => {
    getFileDiff.mockResolvedValue({
      oldContent: 'alpha\nbeta\n',
      newContent: 'alpha\nbeta changed\n',
    })

    const preview = await loadWorkdirHunkPreview({}, '/', 'a.ts')
    expect(preview.hunks.length).toBeGreaterThan(0)
  })

  it('stages selected hunks while preserving full workdir', async () => {
    getFileDiff.mockResolvedValue({
      oldContent: 'line1\nline2\n',
      newContent: 'line1\nline2 changed\nline3\n',
    })

    const writes: string[] = []
    const fs = {
      readFile: vi.fn(async () => 'line1\nline2 changed\nline3\n'),
      writeFile: vi.fn(async (_path: string, content: string) => {
        writes.push(content)
      }),
    }

    const preview = await loadWorkdirHunkPreview(fs, '/', 'b.ts')
    await stageWorkdirHunks(fs, '/', 'b.ts', new Set([0]))

    expect(stageFile).toHaveBeenCalled()
    expect(writes.length).toBe(2)
    expect(writes[1]).toBe('line1\nline2 changed\nline3\n')
    expect(preview.hunks.length).toBeGreaterThan(0)
  })
})
