import type { ProjectFileSource } from './syncTypeScriptProject'

/** Max TS/JS extra libs fed to Monaco (v1.1.4 F2 — avoids worker OOM on huge workspaces). */
export const MAX_MONACO_TS_LIBS = 80

/** Skip huge files in language service (full content still editable). */
export const MAX_MONACO_TS_FILE_BYTES = 100_000

function isScriptFile(file: ProjectFileSource): boolean {
  if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(file.language)) {
    return true
  }
  return /\.(tsx?|jsx?)$/i.test(file.name)
}

function scoreFile(file: ProjectFileSource, activePath: string | undefined): number {
  if (!activePath) return 0
  if (file.name === activePath) return 1000
  const activeDir = activePath.includes('/') ? activePath.slice(0, activePath.lastIndexOf('/')) : ''
  const fileDir = file.name.includes('/') ? file.name.slice(0, file.name.lastIndexOf('/')) : ''
  if (activeDir && fileDir === activeDir) return 500
  if (activeDir && file.name.startsWith(`${activeDir}/`)) return 400
  if (file.name.startsWith('src/')) return 50
  return 0
}

/**
 * Pick a bounded subset of script files for Monaco `setExtraLibs`.
 * Prioritizes the active file and same-folder neighbors.
 */
export function selectMonacoTypeScriptLibs(
  files: ProjectFileSource[],
  activeFilename?: string,
  maxLibs = MAX_MONACO_TS_LIBS,
): ProjectFileSource[] {
  const eligible = files.filter(
    (file) => isScriptFile(file) && file.content.length <= MAX_MONACO_TS_FILE_BYTES,
  )

  if (eligible.length <= maxLibs) return eligible

  const activePath = activeFilename?.trim()
  const ranked = [...eligible].sort((a, b) => {
    const scoreDiff = scoreFile(b, activePath) - scoreFile(a, activePath)
    if (scoreDiff !== 0) return scoreDiff
    return a.name.localeCompare(b.name)
  })

  const picked: ProjectFileSource[] = []
  const seen = new Set<string>()

  if (activePath) {
    const active = ranked.find((file) => file.name === activePath)
    if (active) {
      picked.push(active)
      seen.add(active.name)
    }
  }

  for (const file of ranked) {
    if (picked.length >= maxLibs) break
    if (seen.has(file.name)) continue
    picked.push(file)
    seen.add(file.name)
  }

  return picked
}
