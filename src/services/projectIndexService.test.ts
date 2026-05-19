import { describe, expect, it } from 'vitest'
import {
  buildProjectIndex,
  extractSymbolsFromContent,
  patchIndexedFile,
  removeIndexedFile,
  searchProjectIndex,
  shouldIndexPath,
} from './projectIndexService'

describe('projectIndexService', () => {
  it('extracts function and class symbols', () => {
    const content = `export function hello() {}
class Foo {}
const x = 1`
    const symbols = extractSymbolsFromContent('src/a.ts', content)
    expect(symbols.some((s) => s.name === 'hello' && s.kind === 'function')).toBe(true)
    expect(symbols.some((s) => s.name === 'Foo' && s.kind === 'class')).toBe(true)
  })

  it('searches files and symbols by query', () => {
    const index = buildProjectIndex([
      { path: 'src/auth.ts', content: 'export function login() {}\nexport class Session {}' },
      { path: 'src/util.ts', content: 'export const VERSION = 1' },
    ])
    const hits = searchProjectIndex(index, 'login')
    expect(hits[0]?.type).toBe('symbol')
    expect(hits[0]?.name).toBe('login')
  })

  it('skips node_modules paths', () => {
    expect(shouldIndexPath('node_modules/foo/index.js')).toBe(false)
    expect(shouldIndexPath('src/index.ts')).toBe(true)
    const index = buildProjectIndex([
      { path: 'node_modules/pkg/a.js', content: 'export function hidden() {}' },
      { path: 'src/a.ts', content: 'export function visible() {}' },
    ])
    expect(index.files).toHaveLength(1)
    expect(index.files[0]?.path).toBe('src/a.ts')
  })

  it('patches and removes indexed files incrementally', () => {
    const base = buildProjectIndex([{ path: 'src/a.ts', content: 'export function a() {}' }])
    const patched = patchIndexedFile(base, {
      path: 'src/b.ts',
      content: 'export function b() {}',
    })
    expect(patched.files).toHaveLength(2)
    const removed = removeIndexedFile(patched, 'src/a.ts')
    expect(removed.files).toHaveLength(1)
    expect(removed.files[0]?.path).toBe('src/b.ts')
  })

  it('respects .gitignore in workspace sources', () => {
    const index = buildProjectIndex([
      { path: '.gitignore', content: 'secrets/\n*.log' },
      { path: 'secrets/key.txt', content: 'export function secret() {}' },
      { path: 'src/app.ts', content: 'export function app() {}' },
    ])
    const paths = index.files.map((file) => file.path)
    expect(paths).toContain('src/app.ts')
    expect(paths).not.toContain('secrets/key.txt')
  })
})
