const INVALID_BRANCH_CHARS = /[\s~^:?*[\\]|@\{|\.\./
const INVALID_BRANCH_EDGE = /^\.|\.$|^\/|\/$/

/** Validate a Git branch name (simplified rules for UI). */
export function isValidBranchName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed || trimmed === '.' || trimmed === '..') return false
  if (INVALID_BRANCH_CHARS.test(trimmed)) return false
  if (INVALID_BRANCH_EDGE.test(trimmed)) return false
  if (trimmed.endsWith('.lock')) return false
  return true
}
