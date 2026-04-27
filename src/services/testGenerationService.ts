import { sendMessage } from './aiService'
import type { AIModel } from './aiService'

export interface TestGenerationConfig {
  provider: AIModel
  apiKey: string
  model?: string
  endpoint?: string
}

export interface TestGenerationResult {
  testCode: string
  testCases: Array<{
    name: string
    input: string
    expectedOutput: string
  }>
  explanation: string
}

export const testGenerationService = {
  // 生成单元测试
  async generateTests(
    code: string,
    language: string,
    config: TestGenerationConfig
  ): Promise<TestGenerationResult> {
    const prompt = `Generate comprehensive unit tests for the following ${language} code.

Code to test:
\`\`\`${language}
${code}
\`\`\`

Requirements:
1. Generate tests using the most popular testing framework for ${language}
2. Include edge cases and error handling tests
3. Add descriptive test names
4. Include setup/teardown if needed
5. Add comments explaining what each test verifies

Output format:
1. First, provide the complete test code in a code block
2. Then list the test cases in a structured format
3. Finally, provide a brief explanation of the test coverage

Generate tests:`

    let response = ''
    
    await sendMessage(
      config,
      [
        { role: 'system' as const, content: 'You are a testing expert. Generate high-quality unit tests.' },
        { role: 'user' as const, content: prompt }
      ],
      (chunk: string) => {
        response += chunk
      }
    )

    // Parse response
    const testCodeMatch = response.match(/```[\w]*\n([\s\S]*?)```/)
    const testCode = testCodeMatch ? testCodeMatch[1].trim() : response

    return {
      testCode,
      testCases: this.parseTestCases(response),
      explanation: this.extractExplanation(response)
    }
  },

  // 解析测试用例
  parseTestCases(response: string): Array<{ name: string; input: string; expectedOutput: string }> {
    const cases: Array<{ name: string; input: string; expectedOutput: string }> = []
    
    // 简单的测试用例解析
    const caseMatches = response.matchAll(/[-*]\s*(.+?)\s*[:\-]\s*(.+?)\s*→\s*(.+)/g)
    for (const match of caseMatches) {
      cases.push({
        name: match[1].trim(),
        input: match[2].trim(),
        expectedOutput: match[3].trim()
      })
    }

    return cases
  },

  // 提取解释
  extractExplanation(response: string): string {
    const lines = response.split('\n')
    const explanationIndex = lines.findIndex(l => 
      l.toLowerCase().includes('explanation') || 
      l.toLowerCase().includes('说明') ||
      l.toLowerCase().includes('coverage')
    )
    
    if (explanationIndex >= 0) {
      return lines.slice(explanationIndex + 1).join('\n').trim()
    }

    return '测试已生成'
  },

  // 根据语言获取测试框架
  getTestFramework(language: string): string {
    const frameworks: Record<string, string> = {
      javascript: 'Jest',
      typescript: 'Jest + @types/jest',
      python: 'pytest',
      java: 'JUnit',
      go: 'testing package',
      rust: 'cargo test',
      ruby: 'RSpec'
    }
    return frameworks[language] || 'Recommended testing framework'
  },

  // 生成测试文件名
  getTestFileName(originalFileName: string, language: string): string {
    const testSuffixes: Record<string, string> = {
      javascript: '.test.js',
      typescript: '.test.ts',
      python: '_test.py',
      java: 'Test.java',
      go: '_test.go',
      rust: '_test.rs',
      ruby: '_spec.rb'
    }

    const suffix = testSuffixes[language]
    if (!suffix) return `test_${originalFileName}`

    const lastDot = originalFileName.lastIndexOf('.')
    if (lastDot < 0) return `${originalFileName}${suffix}`

    return originalFileName.slice(0, lastDot) + suffix
  }
}
