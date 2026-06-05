import { describe, expect, it, vi } from 'vitest'

const gitAddMock = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('isomorphic-git', () => ({
  default: {
    add: gitAddMock,
  },
}))

import { addFile, stageFile } from './gitService'

describe('gitService stageFile', () => {
  it('aliases addFile for single-file stage', async () => {
    expect(stageFile).toBe(addFile)
    await stageFile({}, '/', 'src/a.ts')
    expect(gitAddMock).toHaveBeenCalledWith({ fs: {}, dir: '/', filepath: 'src/a.ts' })
  })
})
