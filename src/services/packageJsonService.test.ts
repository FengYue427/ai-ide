import { describe, expect, it } from 'vitest'
import { parsePackageScripts } from './packageJsonService'

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
      { name: 'dev', command: 'vite' },
      { name: 'build', command: 'tsc && vite build' },
    ])
  })

  it('returns empty for invalid json', () => {
    expect(parsePackageScripts([{ name: 'package.json', content: '{' }])).toEqual([])
  })
})
