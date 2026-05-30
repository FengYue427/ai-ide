import type { DefinitionProjectFile } from './registerCrossFileDefinition'

/** Max files scanned for cross-file Go To Definition (v1.1.4 F2). */
export const MAX_DEFINITION_SEARCH_FILES = 120

function scoreFile(file: DefinitionProjectFile, currentFile: string): number {
  if (file.name === currentFile) return 1000
  const currentDir = currentFile.includes('/') ? currentFile.slice(0, currentFile.lastIndexOf('/')) : ''
  const fileDir = file.name.includes('/') ? file.name.slice(0, file.name.lastIndexOf('/')) : ''
  if (currentDir && fileDir === currentDir) return 500
  if (currentDir && file.name.startsWith(`${currentDir}/`)) return 400
  if (file.name.startsWith('src/')) return 50
  return 0
}

/**
 * Pick a bounded subset of workspace files for F12 definition lookup.
 * Always includes the current file when present.
 */
export function selectFilesForDefinitionSearch(
  files: DefinitionProjectFile[],
  currentFile: string,
  maxFiles = MAX_DEFINITION_SEARCH_FILES,
): DefinitionProjectFile[] {
  if (files.length <= maxFiles) return files

  const ranked = [...files].sort((a, b) => {
    const scoreDiff = scoreFile(b, currentFile) - scoreFile(a, currentFile)
    if (scoreDiff !== 0) return scoreDiff
    return a.name.localeCompare(b.name)
  })

  const picked: DefinitionProjectFile[] = []
  const seen = new Set<string>()

  const current = ranked.find((file) => file.name === currentFile)
  if (current) {
    picked.push(current)
    seen.add(current.name)
  }

  for (const file of ranked) {
    if (picked.length >= maxFiles) break
    if (seen.has(file.name)) continue
    picked.push(file)
    seen.add(file.name)
  }

  return picked
}
