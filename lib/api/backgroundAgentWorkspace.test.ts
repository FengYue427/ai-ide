import { describe, expect, it } from 'vitest'
import { BackgroundAgentWorkspace } from './backgroundAgentWorkspace'

describe('BackgroundAgentWorkspace', () => {
  it('tracks pending changes after write_file', () => {
    const ws = new BackgroundAgentWorkspace([
      { name: 'src/a.ts', content: 'const x = 1\n' },
    ])
    ws.writeFile('src/a.ts', 'const x = 2\n')
    ws.writeFile('src/b.ts', 'export {}\n')

    const changes = ws.getPendingChanges()
    expect(changes).toHaveLength(2)
    expect(changes.find((c) => c.path === 'src/a.ts')?.content).toBe('const x = 2\n')
    expect(changes.find((c) => c.path === 'src/b.ts')).toBeTruthy()
  })

  it('lists paths with glob filter', () => {
    const ws = new BackgroundAgentWorkspace([
      { name: 'src/a.ts', content: '' },
      { name: 'README.md', content: '' },
    ])
    const tsOnly = ws.listPaths('src/**/*.ts')
    expect(tsOnly).toEqual(['src/a.ts'])
  })
})
