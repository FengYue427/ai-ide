import { sendMessage, type AIConfig } from './aiService'
import { AGENT_MARKDOWN_SYSTEM } from './agentPromptShared'

export const aiAgentService = {
  buildMessages(
    userGoal: string,
    workspaceSummary: string,
    history: { role: 'user' | 'assistant'; content: string }[],
  ) {
    return [
      {
        role: 'system' as const,
        content: `${AGENT_MARKDOWN_SYSTEM}\n\nWorkspace:\n${workspaceSummary}`,
      },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user' as const, content: userGoal },
    ]
  },

  async runStep(
    config: AIConfig,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    return sendMessage(config, messages, onStream)
  },
}
