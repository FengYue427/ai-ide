export type ChatToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: ChatToolCall[]
      /** DeepSeek thinking mode: must round-trip on tool-call turns */
      reasoning_content?: string | null
    }
  | { role: 'tool'; tool_call_id: string; content: string }

export type ChatCompletionResult = {
  content: string | null
  tool_calls?: ChatToolCall[]
  reasoning_content?: string | null
  finish_reason?: string
}
