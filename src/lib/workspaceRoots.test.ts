import { describe, expect, it } from 'vitest'
import {
  clampActiveFileIndex,
  createWorkspaceRoot,
  defaultWorkspaceRoot,
  hydrateRootsFromMeta,
  nextWorkspaceRootName,
  syncFilesToActiveRoot,
  toWorkspaceRootsMeta,
  workspaceAutosaveKey,
} from './workspaceRoots'

describe('workspaceRoots', () => {
  it('builds autosave key from root id', () => {
    expect(workspaceAutosaveKey('abc')).toBe('autosave-abc')
  })

  it('syncs files only to active root', () => {
    const a = createWorkspaceRoot('a', [{ name: 'a.js', content: 'a', language: 'javascript' }], 'a')
    const b = createWorkspaceRoot('b', [{ name: 'b.js', content: 'b', language: 'javascript' }], 'b')
    const next = syncFilesToActiveRoot([a, b], 'b', [{ name: 'b2.js', content: 'b2', language: 'javascript' }])
    expect(next[0].files[0].name).toBe('a.js')
    expect(next[1].files[0].name).toBe('b2.js')
  })

  it('hydrates roots from meta and file map', () => {
    const files = [{ name: 'index.js', content: 'x', language: 'javascript' }]
    const meta = toWorkspaceRootsMeta([defaultWorkspaceRoot(files)], 'default')
    const hydrated = hydrateRootsFromMeta(meta, new Map([['default', files]]), files)
    expect(hydrated).toHaveLength(1)
    expect(hydrated[0].files[0].content).toBe('x')
  })

  it('picks unused root name', () => {
    const roots = [createWorkspaceRoot('default', [], '1'), createWorkspaceRoot('root-2', [], '2')]
    expect(nextWorkspaceRootName(roots)).toBe('root-3')
  })

  it('clamps active file index when file count shrinks', () => {
    expect(clampActiveFileIndex(5, 3)).toBe(2)
    expect(clampActiveFileIndex(0, 0)).toBe(0)
    expect(clampActiveFileIndex(-1, 2)).toBe(0)
  })

  it('hydrates non-active roots with empty files when missing from map', () => {
    const files = [{ name: 'index.js', content: 'x', language: 'javascript' }]
    const a = createWorkspaceRoot('a', files, 'a')
    const b = createWorkspaceRoot('b', [], 'b')
    const meta = toWorkspaceRootsMeta([a, b], 'a')
    const hydrated = hydrateRootsFromMeta(meta, new Map([['a', files]]), files)
    expect(hydrated.find((r) => r.id === 'b')?.files).toEqual([])
  })
})
