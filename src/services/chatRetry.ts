export interface ChatRetryMessage {
  role: 'user' | 'assistant'
  content: string
}

export function findRetryUserText(messages: ChatRetryMessage[], messageIndex: number): string {
  for (let i = messageIndex - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return ''
}
