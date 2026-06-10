const NORMALIZED_SPECS_ROOT = '.aide/specs'

export function normalizeWorkspacePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

export function isSpecTasksPath(path: string): boolean {
  return /^\.aide\/specs\/[^/]+\/tasks\.md$/i.test(normalizeWorkspacePath(path))
}

export function isSpecsFolderPath(path: string): boolean {
  const normalized = normalizeWorkspacePath(path)
  return normalized === NORMALIZED_SPECS_ROOT || /^\.aide\/specs\/[^/]+$/i.test(normalized)
}

export function isSpecRelatedPath(path: string): boolean {
  const normalized = normalizeWorkspacePath(path)
  if (isSpecTasksPath(normalized) || isSpecsFolderPath(normalized)) return true
  return /^\.aide\/specs\/[^/]+\/(requirements|design|acceptance|hooks)\.(md|ya?ml)$/i.test(normalized)
}

export function specSlugFromPath(path: string): string | null {
  const normalized = normalizeWorkspacePath(path)
  const match = normalized.match(/^\.aide\/specs\/([^/]+)(?:\/|$)/i)
  return match?.[1] ?? null
}

export function tasksPathFromSpecPath(path: string): string | null {
  const normalized = normalizeWorkspacePath(path)
  if (isSpecTasksPath(normalized)) return normalized
  const slug = specSlugFromPath(normalized)
  if (!slug) return null
  return `${NORMALIZED_SPECS_ROOT}/${slug}/tasks.md`
}

export function specNameFromSlug(slug: string): string {
  return slug
}

export function acceptancePathFromTasksPath(tasksPath: string): string {
  return tasksPath.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
}
