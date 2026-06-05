import { describe, expect, it } from 'vitest'
import {
  parsePythonImportLine,
  pythonModuleToCandidatePaths,
  resolvePythonDefinition,
} from './pythonImportNavigation'

describe('pythonImportNavigation', () => {
  it('parses from-import line', () => {
    expect(parsePythonImportLine('from lib.util import greet')).toEqual({
      module: 'lib.util',
      names: ['greet'],
    })
  })

  it('maps dotted module to file paths', () => {
    const paths = pythonModuleToCandidatePaths('lib.util', 'main.py')
    expect(paths).toContain('lib/util.py')
  })

  it('resolves imported symbol to def in module file', () => {
    const result = resolvePythonDefinition({
      currentFile: 'main.py',
      lineContent: 'from lib.util import greet',
      column: 27,
      symbol: 'greet',
      files: [
        { name: 'main.py', content: 'from lib.util import greet\n' },
        { name: 'lib/util.py', content: 'def greet():\n    return 42\n' },
      ],
    })
    expect(result?.path).toBe('lib/util.py')
    expect(result?.line).toBe(1)
  })

  it('resolves module segment util to util.py', () => {
    const result = resolvePythonDefinition({
      currentFile: 'main.py',
      lineContent: 'from lib.util import greet',
      column: 14,
      symbol: 'util',
      files: [
        { name: 'main.py', content: 'from lib.util import greet\n' },
        { name: 'lib/util.py', content: 'def greet():\n    return 1\n' },
      ],
    })
    expect(result?.path).toBe('lib/util.py')
  })
})
