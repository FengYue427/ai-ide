import { projectIndexManager } from '../projectIndexManager'
import { searchProjectIndex } from '../projectIndexService'
import { localProjectService } from '../localProjectService'
import { workspaceContextService } from '../workspaceContextService'
import { detectLanguageFromPath } from '../projectIndexService'
import { syncToLocalDisk } from '../localProjectSync'
import { runTerminalCommand, isTerminalBridgeReady } from '../terminalBridge'
import { normalizeProjectPath } from '../localProjectPaths'
import type { AgentToolCall, AgentToolName, AgentToolResult } from './types'

const MAX_READ_CHARS = 48_000
const MAX_WRITE_CHARS = 512_000
const MAX_LIST = 200
const MAX_TOOL_OUTPUT = 32_000

function truncate(text: string, max = MAX_TOOL_OUTPUT): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…(truncated)`
}

async function readFromWorkspace(path: string, start?: number, end?: number): Promise<string> {
  const file = workspaceContextService.getFile(path)
  if (!file) throw new Error(`FILE_NOT_FOUND: ${path}`)
  const text = file.content
  if (start === undefined && end === undefined) return text
  const lines = text.split(/\r?\n/)
  const s = Math.max(1, start ?? 1)
  const e = Math.min(lines.length, end ?? lines.length)
  return lines.slice(s - 1, e).join('\n')
}

async function writeToWorkspace(path: string, content: string): Promise<void> {
  if (content.length > MAX_WRITE_CHARS) {
    throw new Error('CONTENT_TOO_LARGE')
  }

  const normalized = normalizeProjectPath(path)
  if (!normalized) throw new Error('INVALID_PATH')

  const existing = workspaceContextService.getFile(normalized)
  if (existing) {
    await workspaceContextService.updateFile(normalized, content)
  } else {
    const name = normalized.split('/').pop() || normalized
    await workspaceContextService.addFile({
      name,
      path: normalized,
      content,
      language: detectLanguageFromPath(normalized),
      selected: true,
    })
  }

  projectIndexManager.patchFile({
    path: normalized,
    content,
    language: detectLanguageFromPath(normalized),
  })

  await syncToLocalDisk(normalized, content)
}

export type ExecuteAgentToolOptions = {
  /** When false, write_file stages content for Diff preview instead of applying */
  applyWrites?: boolean
}

export async function executeAgentTool(
  call: AgentToolCall,
  options?: ExecuteAgentToolOptions,
): Promise<AgentToolResult> {
  try {
    const result = await runTool(call.name, call.arguments, options)
    if (typeof result === 'string') {
      return { ok: true, output: truncate(result) }
    }
    return { ok: true, output: truncate(result.output), stagedWrite: result.stagedWrite }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, output: message, error: message }
  }
}

async function runTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  options?: ExecuteAgentToolOptions,
): Promise<string | { output: string; stagedWrite: { path: string; content: string } }> {
  switch (name) {
    case 'list_files': {
      const max = typeof args.max === 'number' ? args.max : 100
      const glob = typeof args.glob === 'string' ? args.glob : undefined
      let paths: string[]

      if (localProjectService.isBound()) {
        paths = await localProjectService.listFiles({ max: Math.min(max, MAX_LIST), glob })
      } else {
        paths = workspaceContextService
          .getAllFiles()
          .map((f) => f.path)
          .slice(0, max)
        if (glob) {
          const re = new RegExp(
            `^${glob.replace(/\*/g, '.*').replace(/\?/g, '.')}$`,
            'i',
          )
          paths = paths.filter((p) => re.test(p))
        }
      }

      if (paths.length === 0) return '(no files)'
      return paths.join('\n')
    }

    case 'read_file': {
      const path = String(args.path ?? '')
      const start = typeof args.start_line === 'number' ? args.start_line : undefined
      const end = typeof args.end_line === 'number' ? args.end_line : undefined

      let text: string
      if (localProjectService.isBound()) {
        try {
          text = await localProjectService.readFile(path, start, end)
        } catch {
          text = await readFromWorkspace(path, start, end)
        }
      } else {
        text = await readFromWorkspace(path, start, end)
      }

      if (text.length > MAX_READ_CHARS) {
        return `${text.slice(0, MAX_READ_CHARS)}\n…(file truncated for context)`
      }
      return text
    }

    case 'write_file': {
      const path = String(args.path ?? '')
      const content = String(args.content ?? '')
      const normalized = normalizeProjectPath(path)
      if (!normalized) throw new Error('INVALID_PATH')

      if (options?.applyWrites === false) {
        return {
          output: `STAGED: ${normalized} (${content.length} chars)`,
          stagedWrite: { path: normalized, content },
        }
      }

      await writeToWorkspace(path, content)
      return `OK: wrote ${path} (${content.length} chars)`
    }

    case 'search_repo': {
      const query = String(args.query ?? '').trim()
      const limit = typeof args.limit === 'number' ? args.limit : 20
      const index = projectIndexManager.getIndex()
      const hits = searchProjectIndex(index, query, limit)
      if (hits.length === 0) return '(no matches)'
      return hits
        .map((h) =>
          h.type === 'symbol'
            ? `${h.path}#${h.name} (${h.kind ?? 'symbol'}:${h.line ?? '?'})`
            : h.path,
        )
        .join('\n')
    }

    case 'run_command': {
      const command = String(args.command ?? '').trim()
      if (!command) return '(empty command)'
      if (!isTerminalBridgeReady()) {
        return 'Terminal not ready. Start WebContainer (npm install / dev stack) first.'
      }
      return await runTerminalCommand(command)
    }

    default:
      throw new Error(`UNKNOWN_TOOL: ${name}`)
  }
}
