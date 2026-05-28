export interface ChatTurnMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function buildMcpFollowUpMessages(
  aiMessages: ChatTurnMessage[],
  assistantSoFar: string,
  followUpInstruction: string,
): ChatTurnMessage[] {
  return [
    ...aiMessages,
    { role: 'assistant', content: assistantSoFar },
    { role: 'user', content: followUpInstruction },
  ]
}
