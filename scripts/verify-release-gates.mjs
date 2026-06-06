/**
 * v1.5.8 — verify unit/E2E baselines.
 *
 * Usage: npm run verify:release:gates
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const MIN_UNIT = 800
const MIN_E2E = 64
const vitestJsonPath = join(root, '.vitest-gate-report.json')

function countTestDeclarations(source) {
  return (source.match(/^\s*(test|it)\(/gm) || []).length
}

let e2e = 0
const e2eDir = join(root, 'e2e')
for (const file of readdirSync(e2eDir).filter((name) => name.endsWith('.spec.ts'))) {
  e2e += countTestDeclarations(readFileSync(join(e2eDir, file), 'utf8'))
}

console.log('=== Release gates (v1.5.8) ===\n')
console.log(`E2E tests (declarations): ${e2e} (min ${MIN_E2E})`)

let failed = 0
if (e2e < MIN_E2E) {
  console.error(`❌ E2E ${e2e} < ${MIN_E2E}`)
  failed++
} else {
  console.log('✅ E2E baseline')
}

console.log('\nRunning unit tests (vitest)…')
try {
  if (existsSync(vitestJsonPath)) unlinkSync(vitestJsonPath)
} catch {
  // ignore
}

const unitRun = spawnSync(
  'npx',
  ['vitest', 'run', '--reporter=json', `--outputFile=${vitestJsonPath}`],
  { cwd: root, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
)

let unitTotal = 0
if (existsSync(vitestJsonPath)) {
  try {
    const report = JSON.parse(readFileSync(vitestJsonPath, 'utf8'))
    unitTotal = Number(report.numTotalTests ?? 0)
  } catch {
    console.error('❌ Failed to parse vitest JSON report')
    failed++
  }
} else if (unitRun.status !== 0) {
  console.error('❌ vitest run failed')
  if (unitRun.stderr) console.error(unitRun.stderr.slice(0, 500))
  failed++
}

console.log(`Unit tests (vitest): ${unitTotal} (min ${MIN_UNIT})`)
if (unitTotal < MIN_UNIT) {
  console.error(`❌ unit ${unitTotal} < ${MIN_UNIT}`)
  failed++
} else if (unitRun.status !== 0) {
  console.error('❌ vitest exited non-zero')
  failed++
} else {
  console.log('✅ unit baseline')
}

if (failed > 0) process.exit(1)
console.log('\n✅ Release gates passed')
