export type AgentToolName =
  | 'list_files'
  | 'read_file'
  | 'write_file'
  | 'search_repo'
  | 'grep_repo'
  | 'run_command'
  | 'move_file'
  | 'delete_file'
  | 'create_dir'

export type AgentToolCall = {
  name: AgentToolName
  arguments: Record<string, unknown>
}

export type AgentToolResult = {
  ok: boolean
  output: string
  error?: string
  stagedWrite?: { path: string; content: string }
  /** Tool output exceeded MAX_TOOL_OUTPUT and was clipped. */
  truncated?: boolean
}

export type OpenAIToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}
