import { buildPlanExecutionPrompt as buildPlanExecutionPromptWorkflow } from './planSpecWorkflowService'
import type { Language } from '../i18n'

export interface PlanStepItem {
  text: string
  line: number
}

export function listPlanSteps(planText: string): PlanStepItem[] {
  return planText
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNo: index + 1 }))
    .filter((item) => /^\s*-\s*\[\s\]\s+.+\s*$/.test(item.line))
    .map((item) => ({
      text: item.line.replace(/^\s*-\s*\[\s\]\s+/, '').trim(),
      line: item.lineNo,
    }))
}

export function getFirstPlanStep(planText: string): string | null {
  const first = listPlanSteps(planText)[0]
  return first?.text ?? null
}

export function buildPlanExecutionPrompt(step: string, locale?: Language): string {
  return buildPlanExecutionPromptWorkflow(step, locale ?? 'zh-CN')
}

export function buildPlanBackgroundJobPrompt(planPath: string, step: string): string {
  return `## Plan\nPath: ${planPath}\n\n${buildPlanExecutionPrompt(step)}`
}

export function parsePlanBackgroundJobPrompt(
  prompt: string,
): { planPath: string; stepText: string } | null {
  const pathMatch = prompt.match(/^## Plan\s*\r?\nPath:\s*(.+)$/m)
  const stepMatch = prompt.match(/^- \[ \]\s+(.+)$/m)
  if (!pathMatch?.[1] || !stepMatch?.[1]) return null
  return { planPath: pathMatch[1].trim(), stepText: stepMatch[1].trim() }
}

export type PlanStepInput = { text: string; line?: number }

function normalizePlanStepText(text: string): string {
  return text.trim().toLowerCase()
}

/** Remove empty / duplicate step texts (first occurrence wins). */
export function dedupePlanSteps(steps: PlanStepInput[]): PlanStepInput[] {
  const seen = new Set<string>()
  const out: PlanStepInput[] = []
  for (const step of steps) {
    const normalized = normalizePlanStepText(step.text)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(step)
  }
  return out
}

export function isPlanStepQueuedInJobs(
  jobs: Array<{ prompt: string; status: string }>,
  planPath: string,
  stepText: string,
): boolean {
  const targetPath = planPath.trim()
  const targetStep = normalizePlanStepText(stepText)
  if (!targetPath || !targetStep) return false

  for (const job of jobs) {
    if (job.status !== 'queued' && job.status !== 'running') continue
    const meta = parsePlanBackgroundJobPrompt(job.prompt)
    if (!meta) continue
    if (meta.planPath !== targetPath) continue
    if (normalizePlanStepText(meta.stepText) === targetStep) return true
  }
  return false
}
