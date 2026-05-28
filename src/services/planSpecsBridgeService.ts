interface FileLike {
  name: string
  content: string
}

const SPEC_TASKS_RE = /^\.aide\/specs\/[^/]+\/tasks\.md$/i
const CHECK_ITEM_RE = /^\s*-\s*\[(?: |x|X)\]\s+(.+)\s*$/gm

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

export function findLatestSpecTasksPath(files: FileLike[]): string | null {
  const matched = listSpecTasksPaths(files)
  if (matched.length === 0) return null
  return matched[matched.length - 1]
}

export function listSpecTasksPaths(files: FileLike[]): string[] {
  return files
    .filter((file) => SPEC_TASKS_RE.test(file.name))
    .map((file) => file.name)
}

export function appendPlanStepsToSpecTasks<T extends FileLike>(
  files: T[],
  specTasksPath: string,
  steps: string[],
): { files: T[]; added: number } {
  if (steps.length === 0) return { files, added: 0 }
  const target = files.find((file) => file.name === specTasksPath)
  if (!target) return { files, added: 0 }

  const existing = new Set(
    Array.from(target.content.matchAll(CHECK_ITEM_RE)).map((m) => normalize(m[1] ?? '')),
  )
  const additions = steps
    .map((step) => step.trim())
    .filter(Boolean)
    .filter((step) => !existing.has(normalize(step)))
  if (additions.length === 0) return { files, added: 0 }

  const appendix = `\n${additions.map((step) => `- [ ] ${step}`).join('\n')}\n`
  const nextFiles = files.map((file) =>
    file.name === specTasksPath ? { ...file, content: `${file.content}${appendix}` } : file,
  )
  return { files: nextFiles, added: additions.length }
}

