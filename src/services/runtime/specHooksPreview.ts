import {
  formatHooksPreviewLines,
  hooksPathFromTasksPath,
  parseHooksYaml,
  type HooksParseResult,
} from './hooksSchema'

interface FileLike {
  name: string
  content: string
}

export interface SpecHooksPreview {
  hooksPath: string
  exists: boolean
  parse: HooksParseResult
  previewLines: string[]
}

export function buildSpecHooksPreview(files: FileLike[], tasksPath: string): SpecHooksPreview {
  const hooksPath = hooksPathFromTasksPath(tasksPath)
  const file = files.find((f) => f.name === hooksPath)
  if (!file) {
    return {
      hooksPath,
      exists: false,
      parse: { ok: false, errors: [] },
      previewLines: [],
    }
  }

  const parse = parseHooksYaml(file.content)
  const previewLines = parse.document ? formatHooksPreviewLines(parse.document) : []

  return { hooksPath, exists: true, parse, previewLines }
}
