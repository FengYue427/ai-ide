import type { SpecStudioTemplateId } from '../data/specStudioTemplates'

export function normalizeWorkspaceFileNames(fileNames: string[]): string[] {
  return fileNames.map((name) => name.replace(/\\/g, '/').toLowerCase())
}

export function isJavaWorkspace(names: string[]): boolean {
  return names.some(
    (name) =>
      name.endsWith('pom.xml') ||
      name.endsWith('build.gradle') ||
      name.endsWith('build.gradle.kts') ||
      name.endsWith('settings.gradle') ||
      name.endsWith('settings.gradle.kts'),
  )
}

export function isPythonWorkspace(names: string[]): boolean {
  return names.some(
    (name) =>
      name.endsWith('pyproject.toml') ||
      name.endsWith('requirements.txt') ||
      name.endsWith('setup.py') ||
      name.endsWith('pipfile'),
  )
}

export function detectRecommendedSpecTemplate(fileNames: string[]): SpecStudioTemplateId {
  const names = normalizeWorkspaceFileNames(fileNames)
  if (isJavaWorkspace(names)) return 'java-service'
  if (names.some((name) => name.endsWith('go.mod'))) return 'go-service'
  if (names.some((name) => name.endsWith('cargo.toml'))) return 'rust-crate'
  if (names.some((name) => name.endsWith('cmakelists.txt') || name.endsWith('.cpp') || name.endsWith('.hpp'))) {
    return 'cpp-module'
  }
  if (isPythonWorkspace(names)) return 'python-service'
  if (names.some((name) => name.endsWith('package.json'))) return 'node-api'
  return 'blank'
}
