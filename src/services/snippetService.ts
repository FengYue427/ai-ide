import { storageService } from './storageService'

export interface CodeSnippet {
  id: string
  name: string
  description?: string
  language: string
  code: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

const SNIPPET_STORAGE_KEY = 'ide-code-snippets'

export const snippetService = {
  // 获取所有代码片段
  async getAllSnippets(): Promise<CodeSnippet[]> {
    const snippets = await storageService.getSetting(SNIPPET_STORAGE_KEY)
    return snippets || []
  },

  // 保存代码片段
  async saveSnippet(snippet: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<CodeSnippet> {
    const snippets = await this.getAllSnippets()
    
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    snippets.push(newSnippet)
    await storageService.saveSetting(SNIPPET_STORAGE_KEY, snippets)
    
    return newSnippet
  },

  // 更新代码片段
  async updateSnippet(id: string, updates: Partial<Omit<CodeSnippet, 'id' | 'createdAt'>>): Promise<CodeSnippet | null> {
    const snippets = await this.getAllSnippets()
    const index = snippets.findIndex(s => s.id === id)
    
    if (index === -1) return null

    snippets[index] = {
      ...snippets[index],
      ...updates,
      updatedAt: Date.now()
    }

    await storageService.saveSetting(SNIPPET_STORAGE_KEY, snippets)
    return snippets[index]
  },

  // 删除代码片段
  async deleteSnippet(id: string): Promise<boolean> {
    const snippets = await this.getAllSnippets()
    const filtered = snippets.filter(s => s.id !== id)
    
    if (filtered.length === snippets.length) return false
    
    await storageService.saveSetting(SNIPPET_STORAGE_KEY, filtered)
    return true
  },

  // 搜索代码片段
  async searchSnippets(query: string, language?: string): Promise<CodeSnippet[]> {
    const snippets = await this.getAllSnippets()
    const lowerQuery = query.toLowerCase()

    return snippets.filter(s => {
      const matchesQuery = 
        s.name.toLowerCase().includes(lowerQuery) ||
        s.description?.toLowerCase().includes(lowerQuery) ||
        s.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        s.code.toLowerCase().includes(lowerQuery)
      
      const matchesLang = !language || s.language === language
      
      return matchesQuery && matchesLang
    })
  },

  // 按语言获取代码片段
  async getSnippetsByLanguage(language: string): Promise<CodeSnippet[]> {
    const snippets = await this.getAllSnippets()
    return snippets.filter(s => s.language === language)
  },

  // 获取热门代码片段（按使用频率，这里简化用时间排序）
  async getRecentSnippets(limit: number = 10): Promise<CodeSnippet[]> {
    const snippets = await this.getAllSnippets()
    return snippets
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
  },

  // 导入代码片段
  async importSnippets(snippets: CodeSnippet[]): Promise<void> {
    const existing = await this.getAllSnippets()
    const merged = [...existing, ...snippets]
    await storageService.saveSetting(SNIPPET_STORAGE_KEY, merged)
  },

  // 导出代码片段
  async exportSnippets(): Promise<string> {
    const snippets = await this.getAllSnippets()
    return JSON.stringify(snippets, null, 2)
  },

  // 获取内置代码片段
  getBuiltinSnippets(): CodeSnippet[] {
    return [
      {
        id: 'builtin-1',
        name: 'React Functional Component',
        description: 'React 函数组件模板',
        language: 'typescript',
        code: `import React from 'react'

interface Props {
  
}

export const Component: React.FC<Props> = () => {
  return (
    <div>
      
    </div>
  )
}`,
        tags: ['react', 'component', 'template'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'builtin-2',
        name: 'UseEffect Hook',
        description: 'React useEffect 模板',
        language: 'typescript',
        code: `useEffect(() => {
  // Effect logic
  
  return () => {
    // Cleanup
  }
}, [])`,
        tags: ['react', 'hook', 'effect'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'builtin-3',
        name: 'Async Function',
        description: '异步函数模板',
        language: 'javascript',
        code: `async function functionName() {
  try {
    // Async code
  } catch (error) {
    console.error('Error:', error)
  }
}`,
        tags: ['async', 'function', 'error-handling'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'builtin-4',
        name: 'Python Class',
        description: 'Python 类定义模板',
        language: 'python',
        code: `class ClassName:
    def __init__(self):
        pass
    
    def method(self):
        pass`,
        tags: ['python', 'class', 'oop'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'builtin-5',
        name: 'Fetch API',
        description: 'Fetch API 请求模板',
        language: 'javascript',
        code: `fetch('https://api.example.com/data')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))`,
        tags: ['fetch', 'api', 'http', 'request'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]
  }
}
