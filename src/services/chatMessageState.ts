export interface ChatUiMessage {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

export function upsertAssistantMessage(
  messages: ChatUiMessage[],
  assistantContent: string,
): ChatUiMessage[] {
  const next = [...messages]
  const last = next[next.length - 1]
  if (last?.role === 'assistant') {
    last.content = assistantContent
  } else {
    next.push({ role: 'assistant', content: assistantContent })
  }
  return next
}

export function removeTrailingUserMessage(
  messages: ChatUiMessage[],
  userContent: string,
): ChatUiMessage[] {
  const next = [...messages]
  const last = next[next.length - 1]
  if (last?.role === 'user' && last.content === userContent) next.pop()
  return next
}
