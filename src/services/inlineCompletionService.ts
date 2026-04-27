import { sendMessage } from './aiService'
import type { AIModel } from './aiService'

export interface CompletionContext {
  prefix: string
  suffix: string
  language: string
  filename: string
}

export interface CompletionItem {
  text: string
  position: number
}

export const inlineCompletionService = {
  // 获取内联代码补全建议
  async getCompletions(
    context: CompletionContext,
    config: {
      provider: AIModel
      apiKey: string
      model?: string
      endpoint?: string
    }
  ): Promise<CompletionItem[]> {
    const { prefix, suffix, language, filename } = context

    const prompt = `You are an intelligent code completion assistant. Given the code context, provide a concise code completion suggestion.

Rules:
1. Only provide the code that should be inserted at the cursor position
2. Do not include explanations or markdown
3. The completion should be syntactically correct ${language} code
4. Keep suggestions short (1-10 lines typically)
5. Match the existing code style
6. Consider the surrounding context

File: ${filename}
Language: ${language}

Code before cursor:
\`\`\`
${prefix.slice(-500)}
\`\`\`

Code after cursor:
\`\`\`
${suffix.slice(0, 200)}
\`\`\`

Provide only the completion code (the part that goes between prefix and suffix):`

    try {
      const messages = [
        { role: 'system' as const, content: 'You are a code completion engine. Output only code, no explanations.' },
        { role: 'user' as const, content: prompt }
      ]

      let completion = ''
      
      await sendMessage(
        config,
        messages,
        (chunk: string) => {
          completion += chunk
        }
      )

      // Clean up the completion
      completion = completion
        .replace(/^```[\w]*\n?/gm, '')
        .replace(/```$/gm, '')
        .trim()

      // Remove common prefixes that might duplicate existing code
      const lastLine = prefix.split('\n').pop() || ''
      if (completion.startsWith(lastLine.trim())) {
        completion = completion.slice(lastLine.trim().length).trimStart()
      }

      if (!completion) return []

      return [{
        text: completion,
        position: prefix.length
      }]
    } catch (error) {
      console.error('Completion error:', error)
      return []
    }
  },

  // 快速补全（基于常见模式）
  getQuickCompletions(
    prefix: string,
    language: string
  ): CompletionItem[] {
    const completions: CompletionItem[] = []
    const linePrefix = prefix.split('\n').pop() || ''

    // Common patterns by language
    const patterns: Record<string, Array<{ trigger: string; completion: string }>> = {
      javascript: [
        { trigger: 'cl', completion: 'console.log()' },
        { trigger: 'fn', completion: 'function () {}' },
        { trigger: 'af', completion: '() => {}' },
        { trigger: 'imp', completion: "import  from ''" },
        { trigger: 'req', completion: "const  = require('')" },
        { trigger: 'try', completion: 'try {} catch (error) {}' },
        { trigger: 'if', completion: 'if () {}' },
        { trigger: 'for', completion: 'for (let i = 0; i < ; i++) {}' },
        { trigger: 'forof', completion: 'for (const item of ) {}' },
      ],
      typescript: [
        { trigger: 'cl', completion: 'console.log()' },
        { trigger: 'fn', completion: 'function ():  {}' },
        { trigger: 'af', completion: '():  => {}' },
        { trigger: 'imp', completion: "import  from ''" },
        { trigger: 'int', completion: 'interface  {}' },
        { trigger: 'type', completion: 'type  = ' },
      ],
      python: [
        { trigger: 'pr', completion: 'print()' },
        { trigger: 'def', completion: 'def ():' },
        { trigger: 'for', completion: 'for  in :' },
        { trigger: 'if', completion: 'if :' },
        { trigger: 'try', completion: 'try:\n    \nexcept Exception as e:\n    ' },
        { trigger: 'imp', completion: 'import ' },
        { trigger: 'from', completion: 'from  import ' },
      ],
      html: [
        { trigger: 'div', completion: '<div></div>' },
        { trigger: 'span', completion: '<span></span>' },
        { trigger: 'p', completion: '<p></p>' },
        { trigger: 'a', completion: "<a href=''></a>" },
        { trigger: 'img', completion: "<img src='' alt='' />" },
        { trigger: 'input', completion: "<input type='text' />" },
      ],
      css: [
        { trigger: 'disp', completion: 'display: ;' },
        { trigger: 'pos', completion: 'position: ;' },
        { trigger: 'mar', completion: 'margin: ;' },
        { trigger: 'pad', completion: 'padding: ;' },
        { trigger: 'bg', completion: 'background: ;' },
        { trigger: 'col', completion: 'color: ;' },
      ]
    }

    const langPatterns = patterns[language] || []
    
    for (const pattern of langPatterns) {
      if (linePrefix.endsWith(pattern.trigger)) {
        completions.push({
          text: pattern.completion,
          position: prefix.length
        })
      }
    }

    return completions
  }
}
