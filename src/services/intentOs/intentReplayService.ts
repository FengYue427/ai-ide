import type { FileItem } from '../../types/file'
import type { IntentGraph } from './intentGraphService'
import { PROOF_REPORT_PREFIX } from './proofOfDoneReportService'
import { specSlugFromPath } from '../../lib/specStudioPaths'

const GRAPH_JSON_BLOCK = /## Intent Graph\s+```json\s*([\s\S]*?)```/i
const TASKS_PATH_LINE = /^-\s*Tasks Path:\s*(.+)$/im

export interface IntentReplayManifest {
  proofPath: string
  tasksPath: string
  specSlug: string
  graph: IntentGraph | null
  generatedAt: string | null
  verifyPassed: boolean
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function parseIntentGraphFromProofMarkdown(markdown: string): IntentGraph | null {
  const match = markdown.match(GRAPH_JSON_BLOCK)
  if (!match?.[1]) return null
  try {
    return JSON.parse(match[1].trim()) as IntentGraph
  } catch {
    return null
  }
}

export function parseTasksPathFromProofMarkdown(markdown: string): string | null {
  const match = markdown.match(TASKS_PATH_LINE)
  return match?.[1]?.trim() ? normalizePath(match[1].trim()) : null
}

export function listProofReportPaths(files: FileItem[]): string[] {
  return files
    .map((file) => normalizePath(file.name))
    .filter((name) => name.startsWith(PROOF_REPORT_PREFIX) && name.endsWith('.md'))
    .sort()
}

export function findLatestProofReportPath(files: FileItem[]): string | null {
  const paths = listProofReportPaths(files)
  return paths.length > 0 ? paths[paths.length - 1]! : null
}

export function buildIntentReplayManifest(files: FileItem[], proofPath: string): IntentReplayManifest | null {
  const normalized = normalizePath(proofPath)
  const file = files.find((f) => normalizePath(f.name) === normalized)
  if (!file) return null

  const tasksPath = parseTasksPathFromProofMarkdown(file.content)
  if (!tasksPath) return null

  const generatedMatch = file.content.match(/^-\s*Generated At:\s*(.+)$/im)
  const verifyMatch = file.content.match(/^-\s*Verify:\s*(PASSED|FAILED)$/im)

  return {
    proofPath: normalized,
    tasksPath,
    specSlug: specSlugFromPath(tasksPath) ?? 'spec',
    graph: parseIntentGraphFromProofMarkdown(file.content),
    generatedAt: generatedMatch?.[1]?.trim() ?? null,
    verifyPassed: verifyMatch?.[1]?.toUpperCase() === 'PASSED',
  }
}

export function buildIntentReplayManifestFromLatest(files: FileItem[]): IntentReplayManifest | null {
  const latest = findLatestProofReportPath(files)
  if (!latest) return null
  return buildIntentReplayManifest(files, latest)
}

export function findLatestProofForTasksPath(files: FileItem[], tasksPath: string): string | null {
  const normalizedTasks = normalizePath(tasksPath)
  const matches = listProofReportPaths(files).filter((proofPath) => {
    const file = files.find((f) => normalizePath(f.name) === proofPath)
    if (!file) return false
    return parseTasksPathFromProofMarkdown(file.content) === normalizedTasks
  })
  return matches.length > 0 ? matches[matches.length - 1]! : null
}

export interface IntentReplayApplyPlan {
  focusTasksPath: string
  proofPath: string
  graphOverlay: IntentGraph | null
  clearFailedSpec: boolean
  openProofInEditor: boolean
}

export function buildIntentReplayApplyPlan(manifest: IntentReplayManifest): IntentReplayApplyPlan {
  return {
    focusTasksPath: manifest.tasksPath,
    proofPath: manifest.proofPath,
    graphOverlay: manifest.graph,
    clearFailedSpec: manifest.verifyPassed,
    openProofInEditor: true,
  }
}
