import type { IntentShareSnapshot } from './intentShareSnapshotService'
import { INTENT_SHARE_META_PATH } from './intentShareSnapshotService'

export interface IntentShareImportResult {
  ok: true
  snapshot: IntentShareSnapshot
  summary: string
}

export interface IntentShareImportError {
  ok: false
  reason: 'invalid-json' | 'unsupported-version' | 'empty-specs'
}

export type IntentShareImportOutcome = IntentShareImportResult | IntentShareImportError

export function parseIntentShareSnapshot(content: string): IntentShareImportOutcome {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return { ok: false, reason: 'invalid-json' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'invalid-json' }
  }

  const snapshot = parsed as Partial<IntentShareSnapshot>
  if (snapshot.version !== 1) {
    return { ok: false, reason: 'unsupported-version' }
  }
  if (!Array.isArray(snapshot.specs) || snapshot.specs.length === 0) {
    return { ok: false, reason: 'empty-specs' }
  }
  if (!snapshot.graph || !Array.isArray(snapshot.graph.nodes)) {
    return { ok: false, reason: 'invalid-json' }
  }

  const normalized: IntentShareSnapshot = {
    version: 1,
    generatedAt: typeof snapshot.generatedAt === 'string' ? snapshot.generatedAt : new Date().toISOString(),
    activeSpecPath: typeof snapshot.activeSpecPath === 'string' ? snapshot.activeSpecPath : null,
    specs: snapshot.specs.map((row) => ({
      slug: String(row.slug ?? ''),
      tasksPath: String(row.tasksPath ?? ''),
      openTasks: Number(row.openTasks ?? 0),
      doneTasks: Number(row.doneTasks ?? 0),
      totalTasks: Number(row.totalTasks ?? 0),
    })),
    graph: snapshot.graph,
  }

  return {
    ok: true,
    snapshot: normalized,
    summary: formatIntentShareImportSummary(normalized),
  }
}

export function formatIntentShareImportSummary(snapshot: IntentShareSnapshot): string {
  const active = snapshot.activeSpecPath
    ? snapshot.specs.find((s) => s.tasksPath === snapshot.activeSpecPath)
    : snapshot.specs[0]
  if (!active) return `${snapshot.specs.length} spec(s)`
  return `${active.slug}: ${active.doneTasks}/${active.totalTasks} · ${snapshot.graph.nodes.length} graph nodes`
}

export interface IntentShareImportFocus {
  focusTasksPath: string
  summary: string
  snapshot: IntentShareSnapshot
}

function normalizeImportedPath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function findIntentShareFileContent(
  files: ReadonlyArray<{ name: string; content: string }>,
): string | null {
  const match = files.find((file) => normalizeImportedPath(file.name) === INTENT_SHARE_META_PATH)
  return match?.content ?? null
}

/** C2 — derive shell focus target from imported workspace files. */
export function applyIntentShareFromImportedFiles(
  files: ReadonlyArray<{ name: string; content: string }>,
): IntentShareImportFocus | null {
  const raw = findIntentShareFileContent(files)
  if (!raw) return null
  const parsed = parseIntentShareSnapshot(raw)
  if (!parsed.ok) return null
  const focusTasksPath =
    parsed.snapshot.activeSpecPath ??
    parsed.snapshot.specs[0]?.tasksPath ??
    null
  if (!focusTasksPath) return null
  return {
    focusTasksPath: normalizeImportedPath(focusTasksPath),
    summary: parsed.summary,
    snapshot: parsed.snapshot,
  }
}

export function applyIntentShareSnapshotContent(content: string): IntentShareImportFocus | null {
  const parsed = parseIntentShareSnapshot(content)
  if (!parsed.ok) return null
  const focusTasksPath =
    parsed.snapshot.activeSpecPath ??
    parsed.snapshot.specs[0]?.tasksPath ??
    null
  if (!focusTasksPath) return null
  return {
    focusTasksPath: normalizeImportedPath(focusTasksPath),
    summary: parsed.summary,
    snapshot: parsed.snapshot,
  }
}
