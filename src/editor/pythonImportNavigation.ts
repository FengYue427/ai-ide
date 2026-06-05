import type { DefinitionProjectFile } from './registerCrossFileDefinition'
import { goToDefinition, goToReferences } from './languageServiceHostCore'
import type { ReferenceLocation } from '../services/referenceIndexService'

export interface PythonDefinitionRequest {
  currentFile: string
  lineContent: string
  column: number
  symbol: string
  files: DefinitionProjectFile[]
}

/** `lib.util` → `lib/util.py` (and `__init__` variants). */
export function pythonModuleToCandidatePaths(modulePath: string, fromFile: string): string[] {
  const isRelative = modulePath.startsWith('.')
  const dotted = modulePath.replace(/^\./, '').replace(/\./g, '/')
  const dir = fromFile.includes('/') ? fromFile.replace(/\/[^/]+$/, '') : ''

  let base = dotted
  if (isRelative && dir) {
    base = `${dir}/${dotted}`.replace(/\/+/g, '/').replace(/^\.\//, '')
  }

  const candidates = [`${base}.py`, `${base}/__init__.py`]
  if (!isRelative) {
    candidates.unshift(`${modulePath.replace(/\./g, '/')}.py`)
  }
  return [...new Set(candidates)]
}

export function parsePythonImportLine(line: string): { module: string; names: string[] } | null {
  const fromMatch = line.match(/^\s*from\s+([\w.]+)\s+import\s+(.+?)\s*(?:#.*)?$/)
  if (!fromMatch) return null
  const names = fromMatch[2]
    .split(',')
    .map((part) => part.trim().split(/\s+as\s+/)[0]?.trim())
    .filter((name): name is string => Boolean(name) && name !== '*')
  return { module: fromMatch[1], names }
}

function findFileIndex(files: DefinitionProjectFile[], targetPath: string): number {
  return files.findIndex(
    (file) => file.name === targetPath || file.name.endsWith(`/${targetPath}`),
  )
}

function resolveModuleFile(
  modulePath: string,
  fromFile: string,
  files: DefinitionProjectFile[],
): { path: string; line: number; column: number } | null {
  for (const candidate of pythonModuleToCandidatePaths(modulePath, fromFile)) {
    const index = findFileIndex(files, candidate)
    if (index < 0) continue
    const file = files[index]
    const symbols = file.content.split(/\r?\n/)
    const defLine = symbols.findIndex((row) => /^\s*def\s+\w+/.test(row) || /^\s*class\s+\w+/.test(row))
    const line = defLine >= 0 ? defLine + 1 : 1
    return { path: file.name, line, column: 1 }
  }
  return null
}

/** v1.3.3 — Python F12 on import line or imported symbol. */
export function resolvePythonDefinition(
  request: PythonDefinitionRequest,
): { path: string; line: number; column?: number } | null {
  const { currentFile, lineContent, symbol, files } = request
  if (!symbol.trim()) return null

  const parsed = parsePythonImportLine(lineContent)
  if (parsed) {
    const moduleSegment = parsed.module.split('.').pop() ?? ''
    if (symbol === moduleSegment || (parsed.module.includes('.') && lineContent.includes(symbol))) {
      const moduleOnly =
        symbol === moduleSegment && !parsed.names.includes(symbol)
          ? parsed.module
          : null
      if (moduleOnly) {
        const mod = resolveModuleFile(parsed.module, currentFile, files)
        if (mod) return mod
      }
    }

    if (parsed.names.includes(symbol)) {
      const viaSymbol = goToDefinition({
        file: currentFile,
        line: 1,
        symbol,
        files,
      })
      if (viaSymbol) return viaSymbol
      const mod = resolveModuleFile(parsed.module, currentFile, files)
      if (mod) return mod
    }
  }

  return goToDefinition({
    file: currentFile,
    line: 1,
    symbol,
    files,
  })
}

/** v1.3.6 — Python Shift+F12 with import-line symbol resolution (same precision tier as F12). */
export function resolvePythonReferences(
  request: PythonDefinitionRequest,
): ReferenceLocation[] {
  const { lineContent, symbol, files } = request
  if (!symbol.trim()) return []

  const parsed = parsePythonImportLine(lineContent)
  if (parsed?.names.includes(symbol)) {
    return goToReferences({ symbol, files })
  }

  return goToReferences({ symbol, files })
}
