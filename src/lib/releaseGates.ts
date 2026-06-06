/** v1.5.8 — release gate baselines (see ROADMAP_V1.5.x_PATCHES.md). */
export const RELEASE_GATE_MIN_UNIT = 800
export const RELEASE_GATE_MIN_E2E = 64

/** Count top-level `test(` or `it(` declarations in a source file. */
export function countTestDeclarations(source: string): number {
  return (source.match(/^\s*(test|it)\(/gm) || []).length
}

export function evaluateReleaseGateCounts(counts: { unit: number; e2e: number }): {
  ok: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (counts.unit < RELEASE_GATE_MIN_UNIT) {
    errors.push(`unit tests ${counts.unit} < ${RELEASE_GATE_MIN_UNIT}`)
  }
  if (counts.e2e < RELEASE_GATE_MIN_E2E) {
    errors.push(`E2E tests ${counts.e2e} < ${RELEASE_GATE_MIN_E2E}`)
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, errors: [] }
}
