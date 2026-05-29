import { buildPlanPathFromName, isUserPlanPath } from './planTemplateService'

interface FileLike {
  name: string
  content: string
  language?: string
}

function titleFromPlanContent(content: string, fallbackPath: string): string {
  const fromHeading = content.match(/^#\s+(.+)\s*$/m)?.[1]?.trim()
  if (fromHeading) return fromHeading
  const normalized = fallbackPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

function applyPlanTitle(content: string, title: string): string {
  if (/^#\s+/m.test(content)) {
    return content.replace(/^#\s+.+$/m, `# ${title}`)
  }
  return `# ${title}\n\n${content}`
}

export function duplicatePlanFile<T extends FileLike>(
  files: T[],
  sourcePath: string,
  copyLabel = ' (copy)',
  now = new Date(),
): { files: T[]; path: string; index: number } | null {
  if (!isUserPlanPath(sourcePath)) return null
  const source = files.find((file) => file.name === sourcePath)
  if (!source) return null

  const baseTitle = titleFromPlanContent(source.content, sourcePath)
  const newTitle = `${baseTitle}${copyLabel}`.trim()
  const path = buildPlanPathFromName(newTitle, files, now)
  const content = applyPlanTitle(source.content, newTitle)
  const file = { name: path, content, language: source.language ?? 'markdown' } as T
  const nextFiles = [...files, file]
  return { files: nextFiles, path, index: nextFiles.length - 1 }
}
