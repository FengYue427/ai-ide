/**
 * Map product version (fourth segment) to semver for electron-builder / electron-updater.
 * @see docs/VERSIONING.md § Electron semver
 */
export function toElectronSemver(version) {
  const raw = String(version ?? '').trim()
  if (!raw) throw new Error('Invalid version: empty')

  // Pre-release / build metadata — pass through (already semver-compatible)
  if (raw.includes('-') || raw.includes('+')) return raw

  const parts = raw.split('.')
  if (parts.length === 3) {
    if (parts.every((p) => /^\d+$/.test(p))) return raw
    throw new Error(`Invalid version: "${raw}"`)
  }
  if (parts.length === 4) {
    if (parts.every((p) => /^\d+$/.test(p))) {
      const [major, minor, patch, sub] = parts
      return `${major}.${minor}.${Number(patch) * 100 + Number(sub)}`
    }
    throw new Error(`Invalid version: "${raw}"`)
  }

  throw new Error(`Invalid version: "${raw}" (expected MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH.N)`)
}
