export interface PackageScript {
  name: string
  command: string
}

export function collectPackageScriptSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): { name: string; content: string }[] {
  return [
    ...editorFiles.map((file) => ({ name: file.name, content: file.content })),
    ...workspaceFiles.map((file) => ({ name: file.path, content: file.content })),
  ]
}

export function parsePackageScripts(sources: { name: string; content: string }[]): PackageScript[] {
  const pkgFile = sources.find(
    (file) => file.name === 'package.json' || file.name.endsWith('/package.json'),
  )
  if (!pkgFile?.content.trim()) return []

  try {
    const parsed = JSON.parse(pkgFile.content) as { scripts?: Record<string, string> }
    const scripts = parsed.scripts ?? {}
    return Object.entries(scripts)
      .map(([name, command]) => ({ name, command }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}
