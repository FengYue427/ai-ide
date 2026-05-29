import { buildPlanExecutionPrompt, listPlanSteps } from './planExecutionService'
import { parseProjectTasks } from './projectTasksService'
import type { QueuedPlanExecution, QueuedSpecExecution } from '../store/ideStore'

export interface ReportRestoreHintPlan {
  planPath: string
  stepText: string
  stepLine?: number
}

export interface ReportRestoreHintSpec {
  taskPath: string
  taskText: string
}

interface FileLike {
  name: string
  content: string
}

const RESTORE_HINT_LINE_RE = /^-\s*(plan|spec)\s*\|\s*(.+)$/im
const PREVIEW_LINE_RE = /^-\s*\d+\.\s+(.+)$/gm
const FAILED_PLAN_RE = /^-\s*Plan:\s*(.+?)\s*\(/im
const FAILED_SPEC_RE = /^-\s*Spec:\s*(.+?)\s*\(/im

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function sectionSlice(markdown: string, heading: string, level: 2 | 3 = 2): string {
  const hashes = '#'.repeat(level)
  const re = new RegExp(`^${hashes}\\s+${heading}\\s*$`, 'im')
  const match = markdown.match(re)
  if (!match || match.index === undefined) return ''
  const start = match.index + match[0].length
  const rest = markdown.slice(start)
  const next = rest.search(/^#{2,3}\s+/m)
  return (next >= 0 ? rest.slice(0, next) : rest).trim()
}

export function parseRestoreHintsFromReport(markdown: string): {
  plan: ReportRestoreHintPlan[]
  spec: ReportRestoreHintSpec[]
} {
  const block = sectionSlice(markdown, 'Restore Hints')
  const plan: ReportRestoreHintPlan[] = []
  const spec: ReportRestoreHintSpec[] = []
  if (!block) return { plan, spec }

  for (const line of block.split(/\r?\n/)) {
    const match = line.match(RESTORE_HINT_LINE_RE)
    if (!match) continue
    const kind = match[1].toLowerCase()
    const parts = match[2].split('|').map((p) => p.trim())
    if (kind === 'plan' && parts.length >= 2) {
      const planPath = parts[0]
      let stepLine: number | undefined
      let stepText: string
      if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
        stepLine = Number.parseInt(parts[1], 10)
        stepText = parts.slice(2).join('|').trim()
      } else {
        stepText = parts.slice(1).join('|').trim()
      }
      if (planPath && stepText) {
        plan.push({
          planPath,
          stepText,
          stepLine: Number.isFinite(stepLine) ? stepLine : undefined,
        })
      }
    } else if (kind === 'spec' && parts.length >= 2) {
      const taskPath = parts[0]
      const taskText = parts.slice(1).join('|').trim()
      if (taskPath && taskText) spec.push({ taskPath, taskText })
    }
  }
  return { plan, spec }
}

export function parseFallbackTextsFromReport(markdown: string): { planTexts: string[]; specTexts: string[] } {
  const planTexts = new Set<string>()
  const specTexts = new Set<string>()

  const planPreview = sectionSlice(markdown, 'Plan Preview', 3)
  const specPreview = sectionSlice(markdown, 'Spec Preview', 3)
  for (const block of [planPreview, specPreview]) {
    for (const match of block.matchAll(PREVIEW_LINE_RE)) {
      const text = match[1]?.trim()
      if (!text || text === 'None') continue
      if (block === planPreview) planTexts.add(text)
      else specTexts.add(text)
    }
  }

  const failure = sectionSlice(markdown, 'Last Failure')
  const failedPlan = failure.match(FAILED_PLAN_RE)?.[1]?.trim()
  const failedSpec = failure.match(FAILED_SPEC_RE)?.[1]?.trim()
  if (failedPlan) planTexts.add(failedPlan)
  if (failedSpec) specTexts.add(failedSpec)

  return { planTexts: [...planTexts], specTexts: [...specTexts] }
}

function findPlanStep(files: FileLike[], stepText: string): ReportRestoreHintPlan | null {
  const target = normalize(stepText)
  for (const file of files) {
    if (!/^\.aide\/plans\/.+\.md$/i.test(file.name)) continue
    for (const step of listPlanSteps(file.content)) {
      if (normalize(step.text) === target) {
        return { planPath: file.name, stepText: step.text, stepLine: step.line }
      }
    }
  }
  return null
}

function findSpecTask(files: FileLike[], taskText: string): ReportRestoreHintSpec | null {
  const target = normalize(taskText)
  for (const file of files) {
    if (!/^\.aide\/specs\/[^/]+\/tasks\.md$/i.test(file.name)) continue
    for (const task of parseProjectTasks(file.content)) {
      if (!task.done && normalize(task.text) === target) {
        return { taskPath: file.name, taskText: task.text }
      }
    }
  }
  return null
}

function buildSpecQueueItem(hint: ReportRestoreHintSpec): QueuedSpecExecution {
  const acceptancePath = hint.taskPath.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
  return {
    prompt: `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${hint.taskPath}] ${hint.taskText}`,
    backfill: {
      taskPath: hint.taskPath,
      taskText: hint.taskText,
      specAcceptancePath: acceptancePath,
    },
  }
}

function buildPlanQueueItem(hint: ReportRestoreHintPlan): QueuedPlanExecution {
  return {
    prompt: buildPlanExecutionPrompt(hint.stepText),
    backfill: {
      planPath: hint.planPath,
      stepText: hint.stepText,
      stepLine: hint.stepLine,
    },
  }
}

export interface QueueRestoreResult {
  planItems: QueuedPlanExecution[]
  specItems: QueuedSpecExecution[]
  unresolved: string[]
}

export function buildQueueRestoreFromReport(markdown: string, files: FileLike[]): QueueRestoreResult {
  const hints = parseRestoreHintsFromReport(markdown)
  const fallback = parseFallbackTextsFromReport(markdown)

  const planHints: ReportRestoreHintPlan[] = [...hints.plan]
  const specHints: ReportRestoreHintSpec[] = [...hints.spec]

  for (const text of fallback.planTexts) {
    if (planHints.some((h) => normalize(h.stepText) === normalize(text))) continue
    const found = findPlanStep(files, text)
    if (found) planHints.push(found)
  }
  for (const text of fallback.specTexts) {
    if (specHints.some((h) => normalize(h.taskText) === normalize(text))) continue
    const found = findSpecTask(files, text)
    if (found) specHints.push(found)
  }

  const seenPlan = new Set<string>()
  const seenSpec = new Set<string>()
  const planItems: QueuedPlanExecution[] = []
  const specItems: QueuedSpecExecution[] = []
  const unresolved: string[] = []

  for (const hint of planHints) {
    const key = `${hint.planPath}::${normalize(hint.stepText)}`
    if (seenPlan.has(key)) continue
    seenPlan.add(key)
    const file = files.find((f) => f.name === hint.planPath)
    if (!file) {
      unresolved.push(`Plan: ${hint.stepText}`)
      continue
    }
    const step = listPlanSteps(file.content).find((s) => normalize(s.text) === normalize(hint.stepText))
    if (!step) {
      unresolved.push(`Plan: ${hint.stepText}`)
      continue
    }
    planItems.push(
      buildPlanQueueItem({
        planPath: hint.planPath,
        stepText: step.text,
        stepLine: hint.stepLine ?? step.line,
      }),
    )
  }

  for (const hint of specHints) {
    const key = `${hint.taskPath}::${normalize(hint.taskText)}`
    if (seenSpec.has(key)) continue
    seenSpec.add(key)
    const file = files.find((f) => f.name === hint.taskPath)
    if (!file) {
      unresolved.push(`Spec: ${hint.taskText}`)
      continue
    }
    const task = parseProjectTasks(file.content).find(
      (t) => !t.done && normalize(t.text) === normalize(hint.taskText),
    )
    if (!task) {
      unresolved.push(`Spec: ${hint.taskText}`)
      continue
    }
    specItems.push(buildSpecQueueItem({ taskPath: hint.taskPath, taskText: task.text }))
  }

  return { planItems, specItems, unresolved }
}

export function mergePlanRestoreItems(
  existing: QueuedPlanExecution[],
  incoming: QueuedPlanExecution[],
  activeBackfill?: { planPath: string; stepText: string } | null,
): QueuedPlanExecution[] {
  const keys = new Set<string>()
  if (activeBackfill) keys.add(`${activeBackfill.planPath}::${normalize(activeBackfill.stepText)}`)
  existing.forEach((item) => keys.add(`${item.backfill.planPath}::${normalize(item.backfill.stepText)}`))
  return [
    ...existing,
    ...incoming.filter((item) => {
      const key = `${item.backfill.planPath}::${normalize(item.backfill.stepText)}`
      if (keys.has(key)) return false
      keys.add(key)
      return true
    }),
  ]
}

export function mergeSpecRestoreItems(
  existing: QueuedSpecExecution[],
  incoming: QueuedSpecExecution[],
  activeBackfill?: { taskPath: string; taskText: string } | null,
): QueuedSpecExecution[] {
  const keys = new Set<string>()
  if (activeBackfill) keys.add(`${activeBackfill.taskPath}::${normalize(activeBackfill.taskText)}`)
  existing.forEach((item) => keys.add(`${item.backfill.taskPath}::${normalize(item.backfill.taskText)}`))
  return [
    ...existing,
    ...incoming.filter((item) => {
      const key = `${item.backfill.taskPath}::${normalize(item.backfill.taskText)}`
      if (keys.has(key)) return false
      keys.add(key)
      return true
    }),
  ]
}
