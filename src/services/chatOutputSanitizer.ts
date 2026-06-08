/** Strip model chain-of-thought / thinking from user-visible chat output. */

const THINK_OPEN = '<' + 'think' + '>'
const THINK_CLOSE = '</' + 'think' + '>'
const THINK_TAG_RE = new RegExp(THINK_OPEN + '[\\s\\S]*?' + THINK_CLOSE, 'gi')
const THINKING_TAG_RE = /<thinking>[\s\S]*?<\/thinking>/gi
const REDACTED_BLOCK_RE = /<redacted[^>]*>[\s\S]*?<\/redacted[^>]*>/gi

const THINKING_SECTION_RE =
  /^#{1,3}\s*(?:思考(?:过程|链)?|内部推理|Thinking(?: process)?|Chain[- ]of[- ]thought|Reasoning(?: trace)?)\s*[\r\n]+[\s\S]*?(?=^#{1,3}\s|\Z)/gim

export type StreamDeltaFields = {
  content?: string | null
  reasoning_content?: string | null
  thinking?: string | null
}

/** SSE delta: only forward normal assistant content, never reasoning fields. */
export function extractUserFacingStreamDelta(delta: StreamDeltaFields | undefined): string {
  if (!delta?.content) return ''
  return typeof delta.content === 'string' ? delta.content : ''
}

export function sanitizeChatAssistantOutput(text: string): string {
  if (!text?.trim()) return text ?? ''

  let out = text
  out = out.replace(THINK_TAG_RE, '')
  out = out.replace(THINKING_TAG_RE, '')
  out = out.replace(REDACTED_BLOCK_RE, '')
  out = out.replace(THINKING_SECTION_RE, '')
  out = out.replace(/\n{3,}/g, '\n\n').trim()
  return out
}
