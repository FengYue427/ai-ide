import type { OpenAIToolDefinition } from './types'

export const AGENT_TOOL_DEFINITIONS: OpenAIToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List relative file paths in the project. Respects .gitignore. Use before read_file.',
      parameters: {
        type: 'object',
        properties: {
          glob: { type: 'string', description: 'Optional glob filter, e.g. src/**/*.ts' },
          max: { type: 'number', description: 'Max paths to return (default 100)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read file content by path relative to project root. Optional line range.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path, e.g. src/App.tsx' },
          start_line: { type: 'number', description: '1-based start line (optional)' },
          end_line: { type: 'number', description: '1-based end line inclusive (optional)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Write or overwrite a file. Updates workspace and local disk when a folder is bound. Path must be relative.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path' },
          content: { type: 'string', description: 'Full file content' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_repo',
      description: 'Search file paths and symbol names in the project index.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command in the WebContainer terminal (e.g. npm test). Not the host OS.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Full command line, e.g. npm run build' },
        },
        required: ['command'],
      },
    },
  },
]
