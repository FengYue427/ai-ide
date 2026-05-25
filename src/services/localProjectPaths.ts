/** Normalize and validate paths relative to local project root. */

const FORBIDDEN = /\.\.|^\/|\\/

export function normalizeProjectPath(raw: string): string | null {
  const trimmed = raw.replace(/\\/g, '/').replace(/^\.\//, '').trim()
  if (!trimmed || FORBIDDEN.test(trimmed)) return null
  const parts = trimmed.split('/').filter((p) => p && p !== '.')
  if (parts.some((p) => p === '..')) return null
  return parts.join('/')
}

export function splitParentAndName(path: string): { parentParts: string[]; name: string } | null {
  const normalized = normalizeProjectPath(path)
  if (!normalized) return null
  const parts = normalized.split('/')
  const name = parts.pop()!
  return { parentParts: parts, name }
}
