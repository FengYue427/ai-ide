interface FileLike {
  name: string
  content: string
}

export interface PlanExecutionBackfill {
  planPath: string
  stepText: string
  runId?: string | null
  assistantOutput: string
  now?: Date
  provider?: string
  model?: string
  status?: 'success' | 'failed'
  validation?: string
  filesTouched?: string[]
}

function extractTouchedFiles(text: string): string[] {
  const re = /(?:^|[\s`"'(])([\w./-]+\.(?:ts|tsx|js|jsx|json|md|css|scss|py|java|go|rs|sql))(?:$|[\s`"'):,])/gm
  const matched = Array.from(text.matchAll(re)).map((m) => m[1])
  return [...new Set(matched)].slice(0, 12)
}

export function buildPlanExecutionBackfillMarkdown(input: PlanExecutionBackfill): string {
  const trimmed = input.assistantOutput.trim()
  if (!trimmed) return ''
  const date = (input.now ?? new Date()).toISOString()
  const status = input.status ?? 'success'
  const filesTouched = input.filesTouched ?? extractTouchedFiles(trimmed)
  const runLine = input.runId ? `- Run ID: ${input.runId}\n` : ''
  const providerLine = input.provider ? `- Provider: ${input.provider}\n` : ''
  const modelLine = input.model ? `- Model: ${input.model}\n` : ''
  const statusLine = `- Status: ${status}\n`
  const validationLine = input.validation ? `- Validation: ${input.validation}\n` : ''
  const filesLine = filesTouched.length > 0 ? `- Files touched: ${filesTouched.join(', ')}\n` : ''
  const summary = trimmed.split(/\r?\n/)[0]?.slice(0, 200) || ''
  const summaryLine = summary ? `- Summary: ${summary}\n` : ''
  return `\n\n---\n## Plan Step Execution (${date})\n- Step: ${input.stepText}\n${statusLine}${runLine}${providerLine}${modelLine}${validationLine}${filesLine}${summaryLine}\n### Assistant Output\n\n${trimmed}\n`
}

export function appendPlanExecutionBackfill<T extends FileLike>(
  files: T[],
  backfill: PlanExecutionBackfill,
): T[] {
  const addition = buildPlanExecutionBackfillMarkdown(backfill)
  if (!addition) return files
  return files.map((file) =>
    file.name === backfill.planPath
      ? { ...file, content: `${file.content}${addition}` }
      : file,
  )
}
