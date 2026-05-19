import { describe, expect, it } from 'vitest'
import { projectIndexManager } from './projectIndexManager'

describe('projectIndexManager', () => {
  it('rebuilds and searches cached index', () => {
    projectIndexManager.rebuild([
      { name: 'src/auth.ts', content: 'export function login() {}', language: 'typescript' },
    ])
    const hits = projectIndexManager.search('login', 5)
    expect(hits.some((hit) => hit.name === 'login')).toBe(true)
  })
})
