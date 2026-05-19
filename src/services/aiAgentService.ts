import { sendMessage, type AIConfig } from './aiService'

const AGENT_SYSTEM_PROMPT = `You are an autonomous coding agent inside a browser IDE.
When the user asks for changes:
1. Plan briefly in one short paragraph.
2. For each file to create or modify, output a separate markdown section titled ### filename.ext
3. Follow each heading with a fenced code block containing the full file content.
4. Prefer minimal, working changes over large rewrites.
5. Do not invent files outside the user's project unless they ask for scaffolding.`

export const aiAgentService = {
  buildMessages(
    userGoal: string,
    workspaceSummary: string,
    history: { role: 'user' | 'assistant'; content: string }[],
  ) {
    return [
      {
        role: 'system' as const,
        content: `${AGENT_SYSTEM_PROMPT}\n\nWorkspace:\n${workspaceSummary}`,
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
