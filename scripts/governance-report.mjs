/**
 * Governance report: file classification + code management signals.
 *
 * Usage:
 *   npm run governance:report
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, relative, extname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const reportDir = join(root, 'docs', 'reports')

const SKIP_DIRS = new Set([
  '.git',
  '.cursor',
  '.next',
  '.vercel',
  'node_modules',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
])

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const DOC_EXT = new Set(['.md'])

function walk(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(full, out)
      continue
    }
    out.push(full)
  }
  return out
}

function countLines(filePath) {
  const text = readFileSync(filePath, 'utf8')
  if (!text) return 0
  return text.split(/\r?\n/).length
}

function toRel(fullPath) {
  return relative(root, fullPath).replaceAll('\\', '/')
}

function classify(relPath) {
  if (relPath.startsWith('src/')) return 'app-frontend'
  if (relPath.startsWith('lib/api/') || relPath.startsWith('api/') || relPath.startsWith('server/')) return 'backend-api'
  if (relPath.startsWith('lib/')) return 'backend-lib'
  if (relPath.startsWith('scripts/')) return 'automation-scripts'
  if (relPath.startsWith('docs/publish/')) return 'docs-publish'
  if (relPath.startsWith('docs/')) return 'docs-product'
  if (relPath.startsWith('electron/')) return 'desktop-shell'
  if (relPath.startsWith('prisma/')) return 'data-schema'
  if (relPath.startsWith('tests/') || relPath.includes('.test.')) return 'tests'
  if (relPath === 'package.json' || relPath.endsWith('.config.ts') || relPath.endsWith('.config.js')) return 'project-config'
  return 'other'
}

function buildClassification(allRelFiles) {
  const buckets = new Map()
  for (const relPath of allRelFiles) {
    const bucket = classify(relPath)
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
  }
  return [...buckets.entries()].sort((a, b) => b[1] - a[1])
}

function getHotspots(allRelFiles) {
  const hotspots = []
  for (const relPath of allRelFiles) {
    const ext = extname(relPath)
    if (!SOURCE_EXT.has(ext)) continue
    const fullPath = join(root, relPath)
    const lines = countLines(fullPath)
    if (lines >= 700) {
      hotspots.push({ path: relPath, lines })
    }
  }
  hotspots.sort((a, b) => b.lines - a.lines)
  return hotspots.slice(0, 15)
}

function getTodoSignals(allRelFiles) {
  const todoHits = []
  for (const relPath of allRelFiles) {
    const ext = extname(relPath)
    if (!SOURCE_EXT.has(ext) && !DOC_EXT.has(ext)) continue
    const fullPath = join(root, relPath)
    const text = readFileSync(fullPath, 'utf8')
    const matches = text.match(/\b(TODO|FIXME|HACK)\b/g)
    if (matches?.length) {
      todoHits.push({ path: relPath, count: matches.length })
    }
  }
  todoHits.sort((a, b) => b.count - a.count)
  return todoHits.slice(0, 20)
}

function getScriptCoverage(allRelFiles) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const scriptValues = Object.values(packageJson.scripts ?? {}).join('\n')
  const scriptFiles = allRelFiles.filter((p) => p.startsWith('scripts/') && p.endsWith('.mjs'))
  const uncovered = scriptFiles.filter((p) => !scriptValues.includes(p.replace('scripts/', 'scripts/')))
  return { total: scriptFiles.length, uncovered }
}

function getTestRatio(allRelFiles) {
  const sourceFiles = allRelFiles.filter(
    (p) => (p.startsWith('src/') || p.startsWith('lib/')) && SOURCE_EXT.has(extname(p)) && !p.includes('.test.'),
  )
  const testFiles = allRelFiles.filter((p) => p.includes('.test.') && SOURCE_EXT.has(extname(p)))
  return {
    sourceCount: sourceFiles.length,
    testCount: testFiles.length,
    ratio: sourceFiles.length === 0 ? 0 : Number((testFiles.length / sourceFiles.length).toFixed(2)),
  }
}

function writeReport(fileName, content) {
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true })
  writeFileSync(join(reportDir, fileName), content, 'utf8')
}

function main() {
  const allFullFiles = walk(root)
  const allRelFiles = allFullFiles.map(toRel)
  const classification = buildClassification(allRelFiles)
  const hotspots = getHotspots(allRelFiles)
  const todoSignals = getTodoSignals(allRelFiles)
  const scriptCoverage = getScriptCoverage(allRelFiles)
  const testRatio = getTestRatio(allRelFiles)
  const now = new Date().toISOString()

  const classificationMd = [
    '# 文件分类报告（最新）',
    '',
    `- 生成时间：${now}`,
    `- 总文件数：${allRelFiles.length}`,
    '',
    '## 分类统计',
    '',
    '| 分类 | 文件数 |',
    '|------|------:|',
    ...classification.map(([name, count]) => `| ${name} | ${count} |`),
    '',
    '## 建议',
    '',
    '- `docs-product` 文件已偏多，建议后续把历史归档迁移到 `docs/archive/`（按世代）。',
    '- `automation-scripts` 已形成工具集，后续可分层为 `scripts/release/`、`scripts/governance/`、`scripts/ops/`。',
    '',
  ].join('\n')

  const managementMd = [
    '# 代码管理报告（最新）',
    '',
    `- 生成时间：${now}`,
    '',
    '## 关键指标',
    '',
    `- 源码文件数（src+lib，排除 test）：**${testRatio.sourceCount}**`,
    `- 测试文件数：**${testRatio.testCount}**`,
    `- 测试文件比值：**${testRatio.ratio}**`,
    `- 脚本总数：**${scriptCoverage.total}**`,
    `- 未被 package scripts 直接引用：**${scriptCoverage.uncovered.length}**`,
    '',
    '## 大文件热点（>=700 行）',
    '',
    '| 文件 | 行数 |',
    '|------|----:|',
    ...(hotspots.length > 0 ? hotspots.map((h) => `| \`${h.path}\` | ${h.lines} |`) : ['| _无_ | 0 |']),
    '',
    '## TODO/FIXME/HACK 信号（Top 20）',
    '',
    '| 文件 | 数量 |',
    '|------|----:|',
    ...(todoSignals.length > 0 ? todoSignals.map((t) => `| \`${t.path}\` | ${t.count} |`) : ['| _无_ | 0 |']),
    '',
    '## 未直接挂载的脚本',
    '',
    ...(scriptCoverage.uncovered.length > 0
      ? scriptCoverage.uncovered.map((p) => `- \`${p}\``)
      : ['- 无']),
    '',
    '## 下一步动作（建议）',
    '',
    '- 优先拆分热点文件前 3 个（按模块边界，不做机械拆分）。',
    '- 对 TODO 信号前 10 个文件补 issue 编号与到期版本。',
    '- 为关键治理脚本建立统一入口：`governance:report`、`check:skeleton`、`deploy:check`。',
    '',
  ].join('\n')

  writeReport('FILE_CLASSIFICATION_LAST.md', classificationMd)
  writeReport('CODE_MANAGEMENT_LAST.md', managementMd)

  console.log('✅ Governance reports generated:')
  console.log(`- docs/reports/FILE_CLASSIFICATION_LAST.md`)
  console.log(`- docs/reports/CODE_MANAGEMENT_LAST.md`)
}

main()
