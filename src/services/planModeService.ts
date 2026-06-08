interface FileLike {
  name: string
  content: string
  language: string
}

export const PLAN_ROOT = '.aide/plans'
export const PROJECT_TASKS_PATH = '.aide/tasks.md'

export { buildPlanModeSystemPrompt } from './planSpecWorkflowService'

export function extractChecklistTasks(planText: string): string[] {
  const matches = planText.matchAll(/^\s*-\s*\[\s\]\s+(.+)\s*$/gm)
  return Array.from(matches, (item) => item[1].trim()).filter(Boolean)
}

export function buildPlanFilePath(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, '-').replace(/\..+$/, '')
  return `${PLAN_ROOT}/plan-${stamp}.md`
}

export function buildPlanFileContent(userInput: string, assistantOutput: string, now = new Date()): string {
  const ts = now.toISOString()
  return `# Plan Run\n\n- Created At: ${ts}\n- Request: ${userInput}\n\n---\n\n${assistantOutput.trim()}\n`
}

function appendTasks(content: string, tasks: string[]): string {
  if (tasks.length === 0) return content
  const tail = tasks.map((task) => `- [ ] ${task}`).join('\n')
  const prefix = content.trim().length === 0 ? '# Tasks\n\n' : `${content.trimEnd()}\n\n`
  return `${prefix}${tail}\n`
}

export function applyPlanArtifacts<T extends FileLike>(
  files: T[],
  userInput: string,
  assistantOutput: string,
  now = new Date(),
): T[] {
  const planPath = buildPlanFilePath(now)
  const planFile = {
    name: planPath,
    content: buildPlanFileContent(userInput, assistantOutput, now),
    language: 'markdown',
  } as T

  const tasks = extractChecklistTasks(assistantOutput)
  const next = [...files]
  next.push(planFile)

  if (tasks.length === 0) return next

  const taskFileIndex = next.findIndex((file) => file.name === PROJECT_TASKS_PATH)
  if (taskFileIndex >= 0) {
    const existing = next[taskFileIndex]
    next[taskFileIndex] = { ...existing, content: appendTasks(existing.content, tasks) }
  } else {
    next.push({
      name: PROJECT_TASKS_PATH,
      content: appendTasks('', tasks),
      language: 'markdown',
    } as T)
  }
  return next
}

export function applyPlanArtifactsWithResult<T extends FileLike>(
  files: T[],
  userInput: string,
  assistantOutput: string,
  now = new Date(),
): { files: T[]; planPath: string; tasks: string[] } {
  const planPath = buildPlanFilePath(now)
  const tasks = extractChecklistTasks(assistantOutput)
  return {
    files: applyPlanArtifacts(files, userInput, assistantOutput, now),
    planPath,
    tasks,
  }
}
