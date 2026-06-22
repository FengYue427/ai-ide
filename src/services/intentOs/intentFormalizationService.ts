import type { Language } from '../../i18n'
import { createSpecStudioBundle } from '../specStudioService'
import type { SpecStudioTemplateId } from '../specStudioService'
import type { SpecTemplateFile } from '../specsService'
import { parseAcceptanceCriteria } from './acceptanceEditorService'
import { parseProjectTasks } from '../projectTasksService'

export type FormalizationStep = 'intent' | 'template' | 'preview'

export type BundleDocKey = 'requirements' | 'design' | 'tasks' | 'acceptance'

export const FORMALIZATION_STEP_ORDER: FormalizationStep[] = ['intent', 'template', 'preview']

export const BUNDLE_DOC_KEYS: BundleDocKey[] = ['requirements', 'design', 'tasks', 'acceptance']

export interface FormalizationPreviewSummary {
  fileCount: number
  openTasks: number
  acceptanceItems: number
  templateId: SpecStudioTemplateId
  specSlug: string
}

export function docKeyFromSpecPath(path: string): BundleDocKey | null {
  const normalized = path.replace(/\\/g, '/')
  if (normalized.endsWith('/requirements.md')) return 'requirements'
  if (normalized.endsWith('/design.md')) return 'design'
  if (normalized.endsWith('/tasks.md')) return 'tasks'
  if (normalized.endsWith('/acceptance.md')) return 'acceptance'
  return null
}

export function injectUserGoalIntoRequirements(content: string, goal: string, locale: Language): string {
  const trimmed = goal.trim()
  if (!trimmed) return content

  const bullet = `- ${trimmed}`
  if (content.includes(bullet)) return content

  const goalsHeader = locale === 'en-US' ? '## Goals' : '## Goals'
  const goalsIndex = content.search(new RegExp(`^${goalsHeader}\\s*$`, 'im'))
  if (goalsIndex >= 0) {
    const lineEnd = content.indexOf('\n', goalsIndex)
    const insertAt = lineEnd >= 0 ? lineEnd + 1 : content.length
    return `${content.slice(0, insertAt)}${bullet}\n${content.slice(insertAt)}`
  }

  return `${content.trimEnd()}\n\n${goalsHeader}\n\n${bullet}\n`
}

export function buildFormalizationPreviewFiles(
  templateId: SpecStudioTemplateId,
  specName: string,
  userGoal: string,
  locale: Language = 'zh-CN',
): SpecTemplateFile[] {
  const bundle = createSpecStudioBundle(templateId, specName, locale)
  return bundle.files.map((file) => {
    if (!file.path.endsWith('/requirements.md')) return file
    return {
      ...file,
      content: injectUserGoalIntoRequirements(file.content, userGoal, locale),
    }
  })
}

export function summarizeFormalizationPreview(
  files: SpecTemplateFile[],
  templateId: SpecStudioTemplateId,
  specSlug: string,
): FormalizationPreviewSummary {
  const tasksFile = files.find((file) => docKeyFromSpecPath(file.path) === 'tasks')
  const acceptanceFile = files.find((file) => docKeyFromSpecPath(file.path) === 'acceptance')
  const openTasks = tasksFile ? parseProjectTasks(tasksFile.content).filter((task) => !task.done).length : 0
  const acceptanceItems = acceptanceFile ? parseAcceptanceCriteria(acceptanceFile.content).length : 0

  return {
    fileCount: files.length,
    openTasks,
    acceptanceItems,
    templateId,
    specSlug,
  }
}

export function applyBundleDocEdits(
  files: SpecTemplateFile[],
  edits: Partial<Record<BundleDocKey, string>>,
): SpecTemplateFile[] {
  if (Object.keys(edits).length === 0) return files
  return files.map((file) => {
    const key = docKeyFromSpecPath(file.path)
    if (!key || edits[key] === undefined) return file
    return { ...file, content: edits[key]! }
  })
}

export function bundleDocContents(files: SpecTemplateFile[]): Partial<Record<BundleDocKey, string>> {
  const out: Partial<Record<BundleDocKey, string>> = {}
  for (const file of files) {
    const key = docKeyFromSpecPath(file.path)
    if (key) out[key] = file.content
  }
  return out
}

export function assembleFormalizationBundle(
  templateId: SpecStudioTemplateId,
  specName: string,
  userGoal: string,
  locale: Language,
  edits: Partial<Record<BundleDocKey, string>> = {},
) {
  const previewFiles = buildFormalizationPreviewFiles(templateId, specName, userGoal, locale)
  const files = applyBundleDocEdits(previewFiles, edits)
  const base = createSpecStudioBundle(templateId, specName, locale)
  return {
    ...base,
    files,
  }
}
