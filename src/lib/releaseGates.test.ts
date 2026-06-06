import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  RELEASE_GATE_MIN_E2E,
  RELEASE_GATE_MIN_UNIT,
  countTestDeclarations,
  evaluateReleaseGateCounts,
} from './releaseGates'

describe('releaseGates', () => {
  it('counts test/it declarations', () => {
    expect(countTestDeclarations('describe("x", () => {\n  it("a", () => {})\n})')).toBe(1)
    expect(countTestDeclarations('test("a", async () => {})\n')).toBe(1)
  })

  it('evaluates thresholds', () => {
    expect(evaluateReleaseGateCounts({ unit: 800, e2e: 64 }).ok).toBe(true)
    expect(evaluateReleaseGateCounts({ unit: 799, e2e: 64 }).ok).toBe(false)
  })

  it('meets v1.5.8 E2E baseline in repo', () => {
    const root = process.cwd()
    let e2e = 0
    const e2eDir = join(root, 'e2e')
    for (const file of readdirSync(e2eDir).filter((name) => name.endsWith('.spec.ts'))) {
      e2e += countTestDeclarations(readFileSync(join(e2eDir, file), 'utf8'))
    }
    expect(e2e).toBeGreaterThanOrEqual(RELEASE_GATE_MIN_E2E)
  })

  it('documents unit baseline constant', () => {
    expect(RELEASE_GATE_MIN_UNIT).toBeGreaterThanOrEqual(800)
    expect(existsSync(join(process.cwd(), 'scripts', 'verify-release-gates.mjs'))).toBe(true)
  })
})
