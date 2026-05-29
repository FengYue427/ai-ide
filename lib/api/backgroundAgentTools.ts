import { filterPathsByGlob, grepInSources } from '../../src/services/agentTools/grepRepoCore'
import type { OpenAIToolDefinition } from '../../src/services/agentTools/types'
import type { BackgroundAgentWorkspace } from './backgroundAgentWorkspace'

export const BACKGROUND_AGENT_TOOL_DEFINITIONS: OpenAIToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List relative file paths in the cloud workspace.',
      parameters: {
        type: 'object',
        properties: {
          glob: { type: 'string', description: 'Optional glob filter, e.g. src/**/*.ts' },
          max: { type: 'number', description: 'Max paths (default 100)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read file content by relative path. Optional 1-based line range.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          start_line: { type: 'number' },
          end_line: { type: 'number' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or overwrite a file with FULL content (not a diff).',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_repo',
      description: 'Search file paths (and simple symbol-like tokens in paths).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'grep_repo',
      description: 'Search file contents for text or regex.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          glob: { type: 'string' },
          limit: { type: 'number' },
          case_sensitive: { type: 'boolean' },
          regex: { type: 'boolean' },
        },
        required: ['pattern'],
      },
    },
  },
]

const MAX_READ_CHARS = 48_000
const MAX_TOOL_OUTPUT = 32_000

export type BackgroundAgentToolName =
  | 'list_files'
  | 'read_file'
  | 'write_file'
  | 'search_repo'
  | 'grep_repo'

export type BackgroundAgentToolResult = {
  ok: boolean
  output: string
  error?: string
  truncated?: boolean
}

function truncate(text: string, max = MAX_TOOL_OUTPUT): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false }
  return { text: `${text.slice(0, max)}\n…(truncated)`, truncated: true }
}

function workspaceFilesForGrep(workspace: BackgroundAgentWorkspace) {
  return workspace.listPaths(undefined, 500).map((path) => ({
    path,
    content: workspace.readFile(path),
  }))
}

function searchPaths(workspace: BackgroundAgentWorkspace, query: string, limit: number): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: string[] = []
  for (const path of workspace.listPaths(undefined, 500)) {
    if (path.toLowerCase().includes(q)) {
      hits.push(path)
      if (hits.length >= limit) return hits
    }
    const base = path.split('/').pop() ?? path
    if (base.toLowerCase().includes(q) && !hits.includes(path)) {
      hits.push(path)
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

export function executeBackgroundAgentTool(
  workspace: BackgroundAgentWorkspace,
  name: BackgroundAgentToolName,
  args: Record<string, unknown>,
): BackgroundAgentToolResult {
  try {
    let output = ''
    switch (name) {
      case 'list_files': {
        const max = typeof args.max === 'number' ? args.max : 100
        const glob = typeof args.glob === 'string' ? args.glob : undefined
        const paths = workspace.listPaths(glob, Math.min(max, 200))
        output = paths.length === 0 ? '(no files)' : paths.join('\n')
        break
      }
      case 'read_file': {
        const path = String(args.path ?? '')
        const start = typeof args.start_line === 'number' ? args.start_line : undefined
        const end = typeof args.end_line === 'number' ? args.end_line : undefined
        let text = workspace.readFile(path, start, end)
        if (text.length > MAX_READ_CHARS) {
          text = `${text.slice(0, MAX_READ_CHARS)}\n…(file truncated for context)`
        }
        output = text
        break
      }
      case 'write_file': {
        const path = String(args.path ?? '')
        const content = String(args.content ?? '')
        workspace.writeFile(path, content)
        output = `OK: wrote ${path} (${content.length} chars)`
        break
      }
      case 'search_repo': {
        const query = String(args.query ?? '').trim()
        const limit = typeof args.limit === 'number' ? args.limit : 20
        const hits = searchPaths(workspace, query, Math.min(Math.max(limit, 1), 50))
        output = hits.length === 0 ? '(no matches)' : hits.join('\n')
        break
      }
      case 'grep_repo': {
        const pattern = String(args.pattern ?? '').trim()
        const glob = typeof args.glob === 'string' ? args.glob : undefined
        const limit = typeof args.limit === 'number' ? args.limit : 40
        const caseSensitive = args.case_sensitive === true
        const regex = args.regex === true
        const files = workspaceFilesForGrep(workspace)
        const editorFiles = files.map((f) => ({ name: f.path, content: f.content }))
        const workspaceFiles = files.map((f) => ({ path: f.path, content: f.content }))
        const hits = grepInSources(editorFiles, workspaceFiles, {
          pattern,
          glob,
          limit,
          caseSensitive,
          regex,
        })
        if (glob) {
          const allowed = new Set(filterPathsByGlob(files.map((f) => f.path), glob))
          const filtered = hits.filter((h) => allowed.has(h.file))
          output =
            filtered.length === 0
              ? '(no matches)'
              : filtered.map((h) => `${h.file}:${h.line}: ${h.content}`).join('\n')
        } else {
          output =
            hits.length === 0
              ? '(no matches)'
              : hits.map((h) => `${h.file}:${h.line}: ${h.content}`).join('\n')
        }
        break
      }
      default:
        throw new Error(`UNKNOWN_TOOL: ${name}`)
    }
    const clipped = truncate(output)
    return { ok: true, output: clipped.text, truncated: clipped.truncated }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, output: message, error: message }
  }
}
