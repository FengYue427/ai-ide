export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export function buildChatHistory(
  messages: ChatHistoryMessage[],
  historyLimit: number,
): ChatHistoryMessage[] {
  return messages
    .slice(1)
    .slice(-historyLimit)
    .map((message) => ({ role: message.role, content: message.content }))
}
