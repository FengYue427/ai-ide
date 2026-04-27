import { sendMessage } from './aiService'
import type { AIModel } from './aiService'

export interface CodeReviewConfig {
  provider: AIModel
  apiKey: string
  model?: string
  endpoint?: string
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'suggestion' | 'style'
  line?: number
  message: string
  code?: string
  suggestion?: string
}

export interface CodeReviewResult {
  score: number // 0-100
  summary: string
  issues: CodeIssue[]
  improvements: string[]
  security: string[]
  performance: string[]
}

export const codeReviewService = {
  async reviewCode(
    code: string,
    language: string,
    filename: string,
    config: CodeReviewConfig
  ): Promise<CodeReviewResult> {
    const prompt = `Perform a comprehensive code review for the following ${language} code.

File: ${filename}

Code:
\`\`\`${language}
${code}
\`\`\`

Please analyze and provide:
1. Overall code quality score (0-100)
2. Brief summary of the code quality
3. List of issues found (with line numbers if applicable), categorized as:
   - Errors (bugs, potential crashes)
   - Warnings (potential issues, edge cases)
   - Suggestions (improvements, best practices)
   - Style (formatting, naming conventions)
4. Specific improvement recommendations
5. Security concerns if any
6. Performance optimization suggestions

Format the response as JSON with this structure:
{
  "score": number,
  "summary": "string",
  "issues": [
    {
      "type": "error|warning|suggestion|style",
      "line": number (optional),
      "message": "string",
      "code": "string (optional, the problematic code)",
      "suggestion": "string (optional, how to fix)"
    }
  ],
  "improvements": ["string"],
  "security": ["string"],
  "performance": ["string"]
}`

    try {
      let response = ''
      
      await sendMessage(
        config,
        [
          { role: 'system' as const, content: 'You are an expert code reviewer. Provide detailed, actionable feedback.' },
          { role: 'user' as const, content: prompt }
        ],
        (chunk: string) => {
          response += chunk
        }
      )

      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return {
          score: result.score || 0,
          summary: result.summary || '审查完成',
          issues: result.issues || [],
          improvements: result.improvements || [],
          security: result.security || [],
          performance: result.performance || []
        }
      }

      // Fallback if JSON parsing fails
      return {
        score: 70,
        summary: '代码审查完成（解析结果不完整）',
        issues: this.parseIssuesFromText(response),
        improvements: [],
        security: [],
        performance: []
      }
    } catch (error) {
      console.error('Code review error:', error)
      return {
        score: 0,
        summary: '审查失败: ' + (error instanceof Error ? error.message : '未知错误'),
        issues: [],
        improvements: [],
        security: [],
        performance: []
      }
    }
  },

  parseIssuesFromText(text: string): CodeIssue[] {
    const issues: CodeIssue[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      // Try to match issue patterns
      const errorMatch = line.match(/(?:error|错误|问题)[^:]*:?\s*(.+)/i)
      const warningMatch = line.match(/(?:warning|警告)[^:]*:?\s*(.+)/i)
      
      if (errorMatch) {
        issues.push({
          type: 'error',
          message: errorMatch[1].trim()
        })
      } else if (warningMatch) {
        issues.push({
          type: 'warning',
          message: warningMatch[1].trim()
        })
      }
    }

    return issues
  },

  // 快速检查（本地规则）
  quickCheck(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = []
    const lines = code.split('\n')

    // Common checks for all languages
    lines.forEach((line, index) => {
      // Check for console.log in production
      if (line.includes('console.log') || line.includes('print(')) {
        issues.push({
          type: 'suggestion',
          line: index + 1,
          message: '发现调试输出语句，建议生产环境移除',
          code: line.trim(),
          suggestion: '使用日志库替代或移除调试代码'
        })
      }

      // Check for TODO comments
      if (line.match(/\/\/\s*TODO|#\s*TODO/i)) {
        issues.push({
          type: 'warning',
          line: index + 1,
          message: '有待办事项（TODO）未处理',
          code: line.trim()
        })
      }

      // Check for long lines
      if (line.length > 100) {
        issues.push({
          type: 'style',
          line: index + 1,
          message: '行长度超过100字符',
          suggestion: '建议换行以提高可读性'
        })
      }
    })

    // Language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      // Check for == instead of ===
      lines.forEach((line, index) => {
        if (line.match(/[^=!]==[^=]/) && !line.includes('===')) {
          issues.push({
            type: 'warning',
            line: index + 1,
            message: '使用了 == 而非 ===',
            code: line.trim(),
            suggestion: '建议使用 === 进行严格相等比较'
          })
        }
      })
    }

    return issues
  }
}
