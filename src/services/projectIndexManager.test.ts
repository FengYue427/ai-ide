import { describe, expect, it, beforeEach } from 'vitest'
import { projectIndexManager } from './projectIndexManager'

describe('projectIndexManager', () => {
  beforeEach(() => {
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

  it('forceRebuildFromWorkspace resets index', () => {
    projectIndexManager.forceRebuildFromWorkspace([
      { name: 'other.ts', content: 'const x = 1', language: 'typescript' },
    ])
    expect(projectIndexManager.search('login', 5)).toHaveLength(0)
    expect(projectIndexManager.search('other', 5).length).toBeGreaterThan(0)
  })
})
