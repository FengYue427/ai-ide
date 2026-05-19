export interface PackageScript {
  name: string
  command: string
}

export function parsePackageScripts(sources: { name: string; content: string }[]): PackageScript[] {
  const pkgFile = sources.find(
    (file) => file.name === 'package.json' || file.name.endsWith('/package.json'),
  )
  if (!pkgFile?.content.trim()) return []

  try {
    const parsed = JSON.parse(pkgFile.content) as { scripts?: Record<string, string> }
    const scripts = parsed.scripts ?? {}
    return Object.entries(scripts).map(([name, command]) => ({ name, command }))
  } catch {
    return []
  }
}
