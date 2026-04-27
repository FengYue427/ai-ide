// 代码格式化服务 - 使用 Prettier

interface FormatOptions {
  parser: 'babel' | 'typescript' | 'css' | 'json' | 'markdown' | 'html'
  tabWidth: number
  useTabs: boolean
  semi: boolean
  singleQuote: boolean
  printWidth: number
}

const defaultOptions: FormatOptions = {
  parser: 'babel',
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  printWidth: 100
}

export const formatService = {
  // 格式化代码（模拟，实际使用 prettier）
  async formatCode(code: string, language: string): Promise<string> {
    const options = this.getOptionsForLanguage(language)
    
    try {
      // 这里简化实现，实际应该动态导入 prettier
      return this.simpleFormat(code, options)
    } catch (error) {
      console.error('格式化失败:', error)
      return code
    }
  },

  // 根据语言获取格式化选项
  getOptionsForLanguage(language: string): FormatOptions {
    const map: Record<string, FormatOptions['parser']> = {
      'javascript': 'babel',
      'typescript': 'typescript',
      'css': 'css',
      'json': 'json',
      'markdown': 'markdown',
      'html': 'html'
    }

    return {
      ...defaultOptions,
      parser: map[language] || 'babel'
    }
  },

  // 简单的格式化实现（作为 fallback）
  simpleFormat(code: string, options: FormatOptions): string {
    const lines = code.split('\n')
    const formatted: string[] = []
    let indentLevel = 0
    const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth)

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      // 跳过空行
      if (!line) {
        formatted.push('')
        continue
      }

      // 减少缩进的情况（行首是闭合符号）
      if (/^[\]})]/.test(line) || /^(end|else|elif|catch|finally)/.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1)
      }

      // 添加缩进
      formatted.push(indent.repeat(indentLevel) + line)

      // 增加缩进的情况（行尾是开启符号）
      if (/[\[{(:]$/.test(line) || /^(if|else|for|while|function|class|try|catch)/.test(line)) {
        // 但如果下一行是闭合，则不增加
        const nextLine = lines[i + 1]?.trim()
        if (nextLine && !/^[\]})]/.test(nextLine)) {
          indentLevel++
        }
      }
    }

    return formatted.join('\n')
  },

  // 检查代码是否有语法错误（简单检查）
  checkSyntax(code: string, language: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 括号匹配检查
    const brackets: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}'
    }
    const stack: string[] = []
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i]
      
      if (brackets[char]) {
        stack.push(brackets[char])
      } else if (Object.values(brackets).includes(char)) {
        const expected = stack.pop()
        if (expected !== char) {
          errors.push(`位置 ${i}: 括号不匹配，期望 ${expected} 但得到 ${char}`)
        }
      }
      
      // 检查字符串引号
      if (char === '"' || char === "'") {
        const nextQuote = code.indexOf(char, i + 1)
        if (nextQuote === -1) {
          errors.push(`位置 ${i}: 字符串引号未闭合`)
          break
        }
        i = nextQuote
      }
    }
    
    if (stack.length > 0) {
      errors.push(`有未闭合的括号: ${stack.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  // 获取格式化配置
  getConfig(): FormatOptions {
    const saved = localStorage.getItem('format_config')
    if (saved) {
      return { ...defaultOptions, ...JSON.parse(saved) }
    }
    return defaultOptions
  },

  // 保存格式化配置
  saveConfig(config: Partial<FormatOptions>): void {
    const current = this.getConfig()
    const newConfig = { ...current, ...config }
    localStorage.setItem('format_config', JSON.stringify(newConfig))
  }
}
