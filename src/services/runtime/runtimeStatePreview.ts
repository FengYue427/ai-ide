import {
  formatRuntimeStateSummaryLines,
  parseRuntimeStateJson,
  RUNTIME_STATE_PATH,
  type RuntimeStateParseResult,
} from './runtimeState'

interface FileLike {
  name: string
  content: string
}

export interface RuntimeStatePreview {
  statePath: string
  exists: boolean
  parse: RuntimeStateParseResult
  summaryLines: string[]
  activeSpecPath: string | null
}

export function buildRuntimeStatePreview(files: FileLike[]): RuntimeStatePreview {
  const file = files.find((f) => f.name === RUNTIME_STATE_PATH)
  if (!file) {
    return {
      statePath: RUNTIME_STATE_PATH,
      exists: false,
      parse: { ok: false, errors: [] },
      summaryLines: [],
      activeSpecPath: null,
    }
  }

  const parse = parseRuntimeStateJson(file.content)
  const summaryLines = parse.document ? formatRuntimeStateSummaryLines(parse.document) : []

  return {
    statePath: RUNTIME_STATE_PATH,
    exists: true,
    parse,
    summaryLines,
    activeSpecPath: parse.document?.activeSpecPath ?? null,
  }
}
