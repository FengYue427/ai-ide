import { extractSymbolsFromContent } from '../services/projectIndexService'
import {
  findReferencesInFiles,
  type ReferenceLocation,
} from '../services/referenceIndexService'
import { selectFilesForDefinitionSearch } from './selectFilesForDefinitionSearch'
import type { DefinitionProjectFile } from './registerCrossFileDefinition'

export interface GoToDefinitionRequest {
  file: string
  line: number
  symbol: string
  files: DefinitionProjectFile[]
}

export function goToDefinition(
  request: GoToDefinitionRequest,
): { path: string; line: number; column?: number } | null {
  const searchFiles = selectFilesForDefinitionSearch(request.files, request.file)
  for (const file of searchFiles) {
    const symbols = extractSymbolsFromContent(file.name, file.content)
    const match = symbols.find((symbol) => symbol.name === request.symbol)
    if (!match) continue
    if (file.name === request.file && match.line === request.line) continue
    const lineText = file.content.split(/\r?\n/)[match.line - 1] ?? ''
    const nameIndex = lineText.indexOf(match.name)
    const column = nameIndex >= 0 ? nameIndex + 1 : 1
    return { path: file.name, line: match.line, column }
  }
  return null
}

export interface GoToReferencesRequest {
  symbol: string
  files: DefinitionProjectFile[]
  maxResults?: number
}

export function goToReferences(request: GoToReferencesRequest): ReferenceLocation[] {
  if (!request.symbol.trim()) return []
  return findReferencesInFiles(
    request.files.map((file) => ({ name: file.name, content: file.content })),
    request.symbol,
    request.maxResults ?? 80,
  )
}
