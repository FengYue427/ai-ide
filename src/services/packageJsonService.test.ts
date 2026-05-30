import { describe, expect, it } from 'vitest'
import { collectPackageScriptSources, parsePackageScripts } from './packageJsonService'

describe('parsePackageScripts', () => {
  it('parses scripts from package.json', () => {
    const scripts = parsePackageScripts([
      {
        name: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'vite', build: 'tsc && vite build' },
        }),
      },
    ])
    expect(scripts).toEqual([
      { name: 'build', command: 'tsc && vite build' },
      { name: 'dev', command: 'vite' },
    ])
  })

  it('returns empty for invalid json', () => {
    expect(parsePackageScripts([{ name: 'package.json', content: '{' }])).toEqual([])
  })

  it('collects editor and workspace sources', () => {
    const scripts = parsePackageScripts(
      collectPackageScriptSources(
        [{ name: 'package.json', content: '{"scripts":{"test":"vitest"}}' }],
        [{ path: 'nested/package.json', content: '{"scripts":{"lint":"eslint ."}}' }],
      ),
    )
    expect(scripts).toEqual([{ name: 'test', command: 'vitest' }])
  })
})
