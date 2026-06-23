import { describe, expect, it, vi } from 'vitest'
import git from 'isomorphic-git'
import { getOriginRemoteUrl } from './gitService'

describe('gitService remote sync', () => {
  it('returns origin remote url when configured', async () => {
    vi.spyOn(git, 'listRemotes').mockResolvedValue([
      { remote: 'origin', url: 'https://github.com/acme/demo.git' },
    ])

    await expect(getOriginRemoteUrl({}, '/')).resolves.toBe('https://github.com/acme/demo.git')
  })

  it('returns null when origin is missing', async () => {
    vi.spyOn(git, 'listRemotes').mockResolvedValue([])

    await expect(getOriginRemoteUrl({}, '/')).resolves.toBeNull()
  })
})
