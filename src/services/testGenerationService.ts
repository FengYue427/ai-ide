import { sendMessage, type AIConfig } from './aiService'

export const testGenerationService = {
  async generateTests(
    code: string,
    language: string,
    filename: string,
    config: AIConfig,
  ): Promise<string> {
    if (!config.apiKey?.trim()) {
      throw new Error('请先在 AI 设置中配置 API Key')
    }

    const prompt = `Generate unit tests for the following ${language} code file "${filename}".
Return ONLY the test code in a single fenced code block, using a sensible test framework for ${language}.
Do not include explanations outside the code block.

Source code:
\`\`\`${language}
${code}
\`\`\``

    const response = await sendMessage(config, [{ role: 'user', content: prompt }])

    const match = response.match(/```[\w]*\n([\s\S]*?)```/)
    return match ? match[1].trim() : response.trim()
  },
}
