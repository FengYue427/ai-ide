/**
 * Acceptable `/api/health` version strings for post-deploy smoke.
 * Allows current release line (1.5.x) and prior stable lines during rollout.
 */
export function isAcceptableSmokeHealthVersion(version) {
  if (!version || typeof version !== 'string') return true
  const v = version.trim()
  if (!v) return true
  if (v === '1.2.0') return true
  if (v.startsWith('1.2.')) return true
  if (v.startsWith('1.3.')) return true
  if (v.startsWith('1.4.')) return true
  if (v.startsWith('1.5.')) return true
  return false
}

export function smokeHealthVersionHint(version) {
  return `expected v1.2.x–v1.5.x, got ${version ?? '?'}`
}
