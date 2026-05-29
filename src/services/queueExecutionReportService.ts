interface FileLike {
  name: string
  content: string
  language: string
}

export const QUEUE_REPORT_ROOT = '.aide/reports'

export interface QueueExecutionReportInput {
  sessionStatus: string
  runId: string | null
  activeTask: string | null
  success: { plan: number; spec: number }
  failure: { plan: number; spec: number }
  recentDone: Array<{ kind: 'plan' | 'spec'; text: string }>
  pending: {
    planQueue: number
    specQueue: number
    sendQueue: number
    planPreview: string[]
    specPreview: string[]
  }
  failedPlan?: { stepText: string; error: string } | null
  failedSpec?: { taskText: string; error: string } | null
  restoreHints?: {
    plan: Array<{ planPath: string; stepText: string; stepLine?: number }>
    spec: Array<{ taskPath: string; taskText: string }>
  }
  now?: Date
}

export function buildQueueReportPath(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, '-').replace(/\..+$/, '')
  return `${QUEUE_REPORT_ROOT}/queue-${stamp}.md`
}

export function buildQueueExecutionReportMarkdown(input: QueueExecutionReportInput): string {
  const ts = (input.now ?? new Date()).toISOString()
  const runLine = input.runId ? ` (${input.runId})` : ''
  const activeLine = input.activeTask ? input.activeTask : 'None'
  const recentLines =
    input.recentDone.length > 0
      ? input.recentDone.map((item, idx) => `- ${idx + 1}. [${item.kind.toUpperCase()}] ${item.text}`)
      : ['- None']
  const planPreview =
    input.pending.planPreview.length > 0
      ? input.pending.planPreview.map((text, idx) => `- ${idx + 1}. ${text}`)
      : ['- None']
  const specPreview =
    input.pending.specPreview.length > 0
      ? input.pending.specPreview.map((text, idx) => `- ${idx + 1}. ${text}`)
      : ['- None']
  const failedLines = [
    input.failedPlan ? `- Plan: ${input.failedPlan.stepText} (${input.failedPlan.error})` : '',
    input.failedSpec ? `- Spec: ${input.failedSpec.taskText} (${input.failedSpec.error})` : '',
  ].filter(Boolean)

  const hintPlan = input.restoreHints?.plan ?? []
  const hintSpec = input.restoreHints?.spec ?? []
  const restoreHintLines = [
    ...hintPlan.map(
      (h) => `- plan | ${h.planPath} | ${h.stepLine ?? ''} | ${h.stepText}`,
    ),
    ...hintSpec.map((h) => `- spec | ${h.taskPath} | ${h.taskText}`),
  ]

  return [
    '# Queue Execution Report',
    '',
    `- Generated At: ${ts}`,
    `- Status: ${input.sessionStatus}${runLine}`,
    `- Active Task: ${activeLine}`,
    `- Success: Plan ${input.success.plan}, Spec ${input.success.spec}`,
    `- Failure: Plan ${input.failure.plan}, Spec ${input.failure.spec}`,
    '',
    '## Recent Done',
    ...recentLines,
    '',
    '## Pending Snapshot',
    `- Plan queue: ${input.pending.planQueue}`,
    `- Spec queue: ${input.pending.specQueue}`,
    `- Send queue: ${input.pending.sendQueue}`,
    '',
    '### Plan Preview',
    ...planPreview,
    '',
    '### Spec Preview',
    ...specPreview,
    '',
    '## Last Failure',
    ...(failedLines.length > 0 ? failedLines : ['- None']),
    '',
    '## Restore Hints',
    ...(restoreHintLines.length > 0 ? restoreHintLines : ['- None']),
    '',
  ].join('\n')
}

export function upsertQueueReportFile<T extends FileLike>(
  files: T[],
  markdown: string,
  path: string,
): { files: T[]; path: string; index: number } {
  const index = files.findIndex((file) => file.name === path)
  if (index >= 0) {
    const next = files.map((file, i) => (i === index ? { ...file, content: markdown } : file))
    return { files: next, path, index }
  }
  const next = [...files, { name: path, content: markdown, language: 'markdown' } as T]
  return { files: next, path, index: next.length - 1 }
}
