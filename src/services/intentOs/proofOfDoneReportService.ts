import type { FileItem } from '../../types/file'
import { acceptancePathFromTasksPath, specSlugFromPath } from '../../lib/specStudioPaths'
import { buildIntentGraph } from './intentGraphService'
import { listSpecTasksPaths } from '../planSpecsBridgeService'
import { parseProjectTasks } from '../projectTasksService'
import {
  parseAcceptanceMarkdown,
  verifyAcceptance,
  type AcceptanceVerifyResult,
} from '../runtime/acceptanceRunner'
import { buildRuntimeStatePreview } from '../runtime/runtimeStatePreview'
import { QUEUE_REPORT_ROOT } from '../queueExecutionReportService'

export const PROOF_REPORT_PREFIX = `${QUEUE_REPORT_ROOT}/proof`

const PATH_IN_TEXT = /`?((?:src|lib|app|api|tests|e2e|public|\.aide)\/[\w./\-]+\.\w+)`?/g

export interface ProofOfDoneReportInput {
  tasksPath: string
  files: FileItem[]
  completedTasks?: string[]
  acceptanceVerify?: AcceptanceVerifyResult
  runId?: string | null
  now?: Date
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-').replace(/\..+$/, '')
}

export function buildProofReportPaths(tasksPath: string, now = new Date()): { md: string; html: string } {
  const slug = specSlugFromPath(tasksPath) ?? 'spec'
  const suffix = stamp(now)
  return {
    md: `${PROOF_REPORT_PREFIX}-${slug}-${suffix}.md`,
    html: `${PROOF_REPORT_PREFIX}-${slug}-${suffix}.html`,
  }
}

export function resolveProofTasksPath(
  files: FileItem[],
  recentSpecTasks: string[],
  explicit?: string | null,
): string | null {
  if (explicit) return normalizePath(explicit)
  const preview = buildRuntimeStatePreview(files)
  if (preview.activeSpecPath) return normalizePath(preview.activeSpecPath)

  for (const taskText of recentSpecTasks) {
    const needle = taskText.trim().toLowerCase()
    for (const path of listSpecTasksPaths(files)) {
      const file = files.find((f) => normalizePath(f.name) === path)
      if (!file) continue
      if (parseProjectTasks(file.content).some((t) => t.text.trim().toLowerCase() === needle)) {
        return path
      }
    }
  }

  const paths = listSpecTasksPaths(files)
  return paths[0] ?? null
}

export function collectDeliverableSnapshots(files: FileItem[], tasksPath: string): Array<{ path: string; content: string }> {
  const normalizedTasks = normalizePath(tasksPath)
  const tasksFile = files.find((f) => normalizePath(f.name) === normalizedTasks)
  const refs = new Set<string>()

  if (tasksFile) {
    for (const task of parseProjectTasks(tasksFile.content)) {
      PATH_IN_TEXT.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = PATH_IN_TEXT.exec(task.text)) !== null) {
        refs.add(normalizePath(match[1]))
      }
    }
  }

  const acceptancePath = acceptancePathFromTasksPath(normalizedTasks)
  const acceptanceFile = files.find((f) => normalizePath(f.name) === acceptancePath)
  if (acceptanceFile) {
    PATH_IN_TEXT.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = PATH_IN_TEXT.exec(acceptanceFile.content)) !== null) {
      refs.add(normalizePath(match[1]))
    }
  }

  return [...refs]
    .map((path) => {
      const file = files.find((f) => normalizePath(f.name) === path)
      return file ? { path, content: file.content } : null
    })
    .filter((row): row is { path: string; content: string } => Boolean(row))
}

function acceptanceSection(
  acceptanceContent: string,
  verify: AcceptanceVerifyResult,
): string[] {
  const parsed = parseAcceptanceMarkdown(acceptanceContent)
  const lines = [
    '## Acceptance',
    '',
    '### Checklist',
    ...(parsed.uncheckedItems.length === 0
      ? ['- All checklist items checked']
      : parsed.uncheckedItems.map((item) => `- [ ] ${item}`)),
    '',
    `**Verify:** ${verify.ok ? 'PASSED' : 'FAILED'}`,
  ]

  if (verify.commandResults.length > 0) {
    lines.push('', '### Command output')
    for (const row of verify.commandResults) {
      lines.push(`- \`${row.command}\` → ${row.status}${row.detail ? ` (${row.detail})` : ''}`)
    }
  }

  if (verify.failures.length > 0) {
    lines.push('', '### Failures')
    for (const failure of verify.failures) {
      lines.push(`- ${failure}`)
    }
  }

  lines.push('', '### acceptance.md snapshot', '', '```markdown', acceptanceContent.trim(), '```', '')
  return lines
}

export function buildProofOfDoneMarkdown(input: ProofOfDoneReportInput): string {
  const now = input.now ?? new Date()
  const tasksPath = normalizePath(input.tasksPath)
  const slug = specSlugFromPath(tasksPath) ?? 'spec'
  const tasksFile = input.files.find((f) => normalizePath(f.name) === tasksPath)
  const acceptancePath = acceptancePathFromTasksPath(tasksPath)
  const acceptanceFile = input.files.find((f) => normalizePath(f.name) === acceptancePath)
  const tasks = tasksFile ? parseProjectTasks(tasksFile.content) : []
  const completedSet = new Set((input.completedTasks ?? []).map((t) => t.trim().toLowerCase()))
  const completed =
    completedSet.size > 0
      ? tasks.filter((t) => completedSet.has(t.text.trim().toLowerCase()) || t.done)
      : tasks.filter((t) => t.done)

  const verify =
    input.acceptanceVerify ??
    verifyAcceptance(acceptanceFile?.content ?? '', { isDesktop: false })

  const graph = buildIntentGraph({ files: input.files, focusTasksPath: tasksPath })
  const snapshots = collectDeliverableSnapshots(input.files, tasksPath)

  const lines = [
    '# Proof of Done Report',
    '',
    `- Generated At: ${now.toISOString()}`,
    `- Spec: ${slug}`,
    `- Tasks Path: ${tasksPath}`,
    ...(input.runId ? [`- Run ID: ${input.runId}`] : []),
    `- Verify: ${verify.ok ? 'PASSED' : 'FAILED'}`,
    '',
    '## Completed Tasks',
    ...(completed.length > 0
      ? completed.map((task, idx) => `- ${idx + 1}. ${task.done ? '[x]' : '[ ]'} ${task.text}`)
      : ['- None recorded']),
    '',
    ...acceptanceSection(acceptanceFile?.content ?? '', verify),
    '## Deliverable Snapshots',
    ...(snapshots.length > 0
      ? snapshots.flatMap(({ path, content }) => [
          `### ${path}`,
          '',
          '```',
          content.trimEnd(),
          '```',
          '',
        ])
      : ['- No referenced deliverable paths captured']),
    '## Intent Graph',
    '',
    '```json',
    JSON.stringify(graph, null, 2),
    '```',
    '',
  ]

  return lines.join('\n')
}

export function buildProofOfDoneHtml(input: ProofOfDoneReportInput): string {
  const now = input.now ?? new Date()
  const tasksPath = normalizePath(input.tasksPath)
  const slug = specSlugFromPath(tasksPath) ?? 'spec'
  const tasksFile = input.files.find((f) => normalizePath(f.name) === tasksPath)
  const acceptancePath = acceptancePathFromTasksPath(tasksPath)
  const acceptanceFile = input.files.find((f) => normalizePath(f.name) === acceptancePath)
  const tasks = tasksFile ? parseProjectTasks(tasksFile.content) : []
  const completedSet = new Set((input.completedTasks ?? []).map((t) => t.trim().toLowerCase()))
  const completed =
    completedSet.size > 0
      ? tasks.filter((t) => completedSet.has(t.text.trim().toLowerCase()) || t.done)
      : tasks.filter((t) => t.done)

  const verify =
    input.acceptanceVerify ??
    verifyAcceptance(acceptanceFile?.content ?? '', { isDesktop: false })

  const graph = buildIntentGraph({ files: input.files, focusTasksPath: tasksPath })
  const snapshots = collectDeliverableSnapshots(input.files, tasksPath)
  const verifyLabel = verify.ok ? 'PASSED' : 'FAILED'
  const verifyClass = verify.ok ? 'pod-badge--pass' : 'pod-badge--fail'

  const taskItems =
    completed.length > 0
      ? completed
          .map(
            (task, idx) =>
              `<li class="pod-task"><span class="pod-task__idx">${idx + 1}</span><span>${escapeHtml(task.text)}</span></li>`,
          )
          .join('\n')
      : '<li class="pod-muted">None recorded</li>'

  const snapshotBlocks =
    snapshots.length > 0
      ? snapshots
          .map(
            ({ path, content }) => `<section class="pod-section">
  <h3>${escapeHtml(path)}</h3>
  <pre class="pod-code"><code>${escapeHtml(content.trimEnd())}</code></pre>
</section>`,
          )
          .join('\n')
      : '<p class="pod-muted">No referenced deliverable paths captured</p>'

  const commandRows =
    verify.commandResults.length > 0
      ? verify.commandResults
          .map(
            (row) =>
              `<li><code>${escapeHtml(row.command)}</code> → ${escapeHtml(row.status)}${
                row.detail ? ` <span class="pod-muted">(${escapeHtml(row.detail)})</span>` : ''
              }</li>`,
          )
          .join('\n')
      : ''

  const failureRows =
    verify.failures.length > 0
      ? verify.failures.map((failure) => `<li>${escapeHtml(failure)}</li>`).join('\n')
      : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Proof of Done · ${escapeHtml(slug)} · AI IDE</title>
  <style>
    :root { color-scheme: light dark; --bg: #0b1020; --card: #121a2e; --text: #e8edf7; --muted: #93a0b8; --accent: #5b8cff; --pass: #3ecf8e; --fail: #ff6b6b; --border: rgba(255,255,255,0.08); }
    @media (prefers-color-scheme: light) {
      :root { --bg: #f6f8fc; --card: #fff; --text: #111827; --muted: #6b7280; --border: rgba(17,24,39,0.08); }
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: radial-gradient(circle at top, color-mix(in srgb, var(--accent) 12%, var(--bg)), var(--bg)); color: var(--text); line-height: 1.55; }
    .pod-wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; }
    .pod-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .pod-logo { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), #8b5cf6); display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 14px; }
    .pod-brand__title { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .pod-brand__subtitle { font-size: 24px; font-weight: 800; margin-top: 2px; }
    .pod-hero { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
    .pod-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
    .pod-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid var(--border); background: color-mix(in srgb, var(--card) 80%, var(--accent) 20%); }
    .pod-badge--pass { color: var(--pass); border-color: color-mix(in srgb, var(--pass) 35%, var(--border)); }
    .pod-badge--fail { color: var(--fail); border-color: color-mix(in srgb, var(--fail) 35%, var(--border)); }
    .pod-section { margin-top: 28px; }
    .pod-section h2 { font-size: 16px; margin: 0 0 10px; }
    .pod-section h3 { font-size: 13px; margin: 0 0 8px; color: var(--muted); }
    .pod-list { margin: 0; padding-left: 18px; }
    .pod-task { list-style: none; margin: 0 0 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: color-mix(in srgb, var(--card) 92%, var(--accent) 8%); display: flex; gap: 10px; }
    .pod-task__idx { color: var(--muted); font-weight: 700; min-width: 1.5em; }
    .pod-code { margin: 0; padding: 14px; border-radius: 12px; overflow: auto; border: 1px solid var(--border); background: #0a0f1a; color: #dbeafe; font-size: 12px; line-height: 1.45; }
    @media (prefers-color-scheme: light) { .pod-code { background: #0f172a; } }
    .pod-muted { color: var(--muted); }
    .pod-footer { margin-top: 32px; font-size: 12px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="pod-wrap">
    <header class="pod-brand">
      <div class="pod-logo" aria-hidden="true">AI</div>
      <div>
        <div class="pod-brand__title">AI IDE · Intent OS</div>
        <div class="pod-brand__subtitle">Proof of Done</div>
      </div>
    </header>
    <main class="pod-hero">
      <h1 style="margin:0;font-size:28px;">${escapeHtml(slug)}</h1>
      <p class="pod-muted" style="margin:8px 0 0;">Generated ${escapeHtml(now.toISOString())}${input.runId ? ` · Run ${escapeHtml(input.runId)}` : ''}</p>
      <div class="pod-meta">
        <span class="pod-badge">Spec · ${escapeHtml(tasksPath)}</span>
        <span class="pod-badge ${verifyClass}">Verify · ${verifyLabel}</span>
        <span class="pod-badge">${completed.length} task(s) done</span>
      </div>
      <section class="pod-section">
        <h2>Completed Tasks</h2>
        <ul class="pod-list">${taskItems}</ul>
      </section>
      <section class="pod-section">
        <h2>Acceptance</h2>
        <p><span class="pod-badge ${verifyClass}">${verifyLabel}</span></p>
        ${commandRows ? `<ul class="pod-list">${commandRows}</ul>` : ''}
        ${failureRows ? `<ul class="pod-list">${failureRows}</ul>` : ''}
      </section>
      <section class="pod-section">
        <h2>Deliverable Snapshots</h2>
        ${snapshotBlocks}
      </section>
      <section class="pod-section">
        <h2>Intent Graph</h2>
        <pre class="pod-code"><code>${escapeHtml(JSON.stringify(graph, null, 2))}</code></pre>
      </section>
    </main>
    <footer class="pod-footer">Exported from AI IDE Intent OS · proof report is read-only evidence, not a live workspace.</footer>
  </div>
</body>
</html>`
}

export function upsertProofReportFiles<T extends { name: string; content: string; language: string }>(
  files: T[],
  markdown: string,
  html: string,
  paths: { md: string; html: string },
  options?: { includeHtml?: boolean },
): { files: T[]; mdIndex: number; htmlIndex: number } {
  const includeHtml = options?.includeHtml !== false
  let next = [...files]
  let mdIndex = next.findIndex((f) => f.name === paths.md)
  if (mdIndex >= 0) {
    next = next.map((f, i) => (i === mdIndex ? { ...f, content: markdown } : f))
  } else {
    next = [...next, { name: paths.md, content: markdown, language: 'markdown' } as T]
    mdIndex = next.length - 1
  }

  let htmlIndex = mdIndex
  if (includeHtml && html) {
    htmlIndex = next.findIndex((f) => f.name === paths.html)
    if (htmlIndex >= 0) {
      next = next.map((f, i) => (i === htmlIndex ? { ...f, content: html } : f))
    } else {
      next = [...next, { name: paths.html, content: html, language: 'html' } as T]
      htmlIndex = next.length - 1
    }
  }

  return { files: next, mdIndex, htmlIndex }
}
