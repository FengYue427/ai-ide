export type AgentToolName =
  | 'list_files'
  | 'read_file'
  | 'write_file'
  | 'search_repo'
  | 'run_command'

export type AgentToolCall = {
  name: AgentToolName
  arguments: Record<string, unknown>
}

export type AgentToolResult = {
  ok: boolean
  output: string
  error?: string
  stagedWrite?: { path: string; content: string }
}

export type OpenAIToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}
