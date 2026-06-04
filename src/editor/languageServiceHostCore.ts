import { extractSymbolsFromContent } from '../services/projectIndexService'
import { selectFilesForDefinitionSearch } from './selectFilesForDefinitionSearch'
import type { DefinitionProjectFile } from './registerCrossFileDefinition'

export interface GoToDefinitionRequest {
  file: string
  line: number
  symbol: string
  files: DefinitionProjectFile[]
}

export function goToDefinition(request: GoToDefinitionRequest): { path: string; line: number } | null {
  const searchFiles = selectFilesForDefinitionSearch(request.files, request.file)
  for (const file of searchFiles) {
    const symbols = extractSymbolsFromContent(file.name, file.content)
    const match = symbols.find((symbol) => symbol.name === request.symbol)
    if (!match) continue
    if (file.name === request.file && match.line === request.line) continue
    return { path: file.name, line: match.line }
  }
  return null
}
