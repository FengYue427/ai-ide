import { describe, expect, it, beforeEach } from 'vitest'
import { projectIndexManager } from './projectIndexManager'

describe('projectIndexManager', () => {
  beforeEach(() => {
    projectIndexManager.resetScopesForTests()
    projectIndexManager.rebuild([
      { name: 'src/auth.ts', content: 'export function login() {}', language: 'typescript' },
    ])
  })

  it('rebuilds and searches cached index', () => {
    const hits = projectIndexManager.search('login', 5)
    expect(hits.some((hit) => hit.name === 'login')).toBe(true)
    expect(projectIndexManager.getBuildState().status).toBe('ready')
  })

  it('incrementally patches a changed file', () => {
    projectIndexManager.syncFromWorkspace([
      { name: 'src/auth.ts', content: 'export function login() {}\nexport function logout() {}', language: 'typescript' },
    ])
    const hits = projectIndexManager.search('logout', 5)
    expect(hits.some((hit) => hit.name === 'logout')).toBe(true)
  })

  it('keeps separate indexes per workspace scope', () => {
    projectIndexManager.setWorkspaceScope('root-a')
    projectIndexManager.rebuild([{ name: 'root-a-only.ts', content: 'export const a = 1', language: 'typescript' }])
    expect(projectIndexManager.getIndex().files.some((f) => f.path === 'root-a-only.ts')).toBe(true)

    projectIndexManager.setWorkspaceScope('root-b')
    projectIndexManager.rebuild([{ name: 'root-b-only.ts', content: 'export const b = 2', language: 'typescript' }])
    expect(projectIndexManager.getWorkspaceScope()).toBe('root-b')
    expect(projectIndexManager.getIndex().files.some((f) => f.path === 'root-b-only.ts')).toBe(true)
    expect(projectIndexManager.getIndex().files.some((f) => f.path === 'root-a-only.ts')).toBe(false)

    projectIndexManager.setWorkspaceScope('root-a')
    expect(projectIndexManager.getIndex().files.some((f) => f.path === 'root-a-only.ts')).toBe(true)
    expect(projectIndexManager.getIndex().files.some((f) => f.path === 'root-b-only.ts')).toBe(false)
  })

  it('forceRebuildFromWorkspace resets index', () => {
    projectIndexManager.forceRebuildFromWorkspace([
      { name: 'other.ts', content: 'const x = 1', language: 'typescript' },
    ])
    expect(projectIndexManager.search('login', 5)).toHaveLength(0)
    expect(projectIndexManager.search('other', 5).length).toBeGreaterThan(0)
  })
})
