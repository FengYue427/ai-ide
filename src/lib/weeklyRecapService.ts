/**
 * Weekly recap from workspace .aide/reports and spec task completion.
 */
import type { FileItem } from '../types/file'
import { listSpecTasksPaths } from '../services/planSpecsBridgeService'
import { parseProjectTasks } from '../services/projectTasksService'
import { QUEUE_REPORT_ROOT } from '../services/queueExecutionReportService'
import { PROOF_REPORT_PREFIX } from '../services/intentOs/proofOfDoneReportService'
import { LEARNING_PATHS } from './learningPaths'
import { getLearningPathStatus } from './learningPathProgress'

export interface WeeklyRecap {
  proofReportCount: number
  queueReportCount: number
  doneTaskCount: number
  openTaskCount: number
  specCount: number
  recentProofPaths: string[]
  learningPathCompleted: string[]
  learningPathInProgress: string[]
}

export function buildWeeklyRecap(files: FileItem[]): WeeklyRecap {
  let doneTaskCount = 0
  let openTaskCount = 0
  const specPaths = listSpecTasksPaths(files)
  for (const path of specPaths) {
    const file = files.find((f) => f.name === path)
    if (!file) continue
    const tasks = parseProjectTasks(file.content)
    doneTaskCount += tasks.filter((t) => t.done).length
    openTaskCount += tasks.filter((t) => !t.done).length
  }

  const reportFiles = files.filter(
    (f) => f.name.startsWith(`${QUEUE_REPORT_ROOT}/`) && f.name.endsWith('.md'),
  )
  const proofPaths = files
    .filter((f) => f.name.startsWith(PROOF_REPORT_PREFIX) && f.name.endsWith('.html'))
    .map((f) => f.name)
    .slice(-8)

  const proofReportCount = files.filter(
    (f) => f.name.startsWith(PROOF_REPORT_PREFIX) && (f.name.endsWith('.md') || f.name.endsWith('.html')),
  ).length

  const learningPathCompleted = LEARNING_PATHS.filter((path) => getLearningPathStatus(path.id) === 'completed').map(
    (path) => path.id,
  )
  const learningPathInProgress = LEARNING_PATHS.filter(
    (path) => getLearningPathStatus(path.id) === 'in_progress',
  ).map((path) => path.id)

  return {
    proofReportCount,
    queueReportCount: reportFiles.length,
    doneTaskCount,
    openTaskCount,
    specCount: specPaths.length,
    recentProofPaths: proofPaths,
    learningPathCompleted,
    learningPathInProgress,
  }
}

export interface WeeklyRecapLabels {
  title: string
  doneTasks: string
  openTasks: string
  proofReports: string
  specs: string
  recentProofs: string
  learningPathsCompleted: string
  learningPathsInProgress: string
  empty: string
}

export function formatWeeklyRecapMarkdown(recap: WeeklyRecap, labels: WeeklyRecapLabels): string {
  const lines = [
    `# ${labels.title}`,
    '',
    `- ${labels.doneTasks}: ${recap.doneTaskCount}`,
    `- ${labels.openTasks}: ${recap.openTaskCount}`,
    `- ${labels.proofReports}: ${recap.proofReportCount}`,
    `- ${labels.specs}: ${recap.specCount}`,
  ]
  if (recap.recentProofPaths.length > 0) {
    lines.push('', `## ${labels.recentProofs}`, ...recap.recentProofPaths.map((path) => `- ${path}`))
  } else {
    lines.push('', labels.empty)
  }
  if (recap.learningPathCompleted.length > 0) {
    lines.push('', `## ${labels.learningPathsCompleted}`, ...recap.learningPathCompleted.map((id) => `- ${id}`))
  }
  if (recap.learningPathInProgress.length > 0) {
    lines.push('', `## ${labels.learningPathsInProgress}`, ...recap.learningPathInProgress.map((id) => `- ${id}`))
  }
  return lines.join('\n')
}
