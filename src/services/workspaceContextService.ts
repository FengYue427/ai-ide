/**
 * 工作区上下文服务 - 管理多文件工作区的AI上下文
 * 这是AI IDE的核心优势：让AI理解整个项目结构，而不仅仅是当前文件
 */

import { localStorageService, StorageKeys } from './localStorageService'

export interface WorkspaceFile {
  name: string
  path: string  // 相对于工作区的路径
  content: string
  language: string
  size: number
  lastModified: number
  selected?: boolean  // 是否参与AI上下文
}

export interface WorkspaceContext {
  name: string
  files: WorkspaceFile[]
  rootPath: string
  description?: string
}

const MAX_FILE_SIZE = 1024 * 1024 // 1MB 单文件限制
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 // 10MB 总限制
const MAX_FILES = 100 // 最大文件数

class WorkspaceContextService {
  private context: WorkspaceContext | null = null

  constructor() {
    this.loadFromStorage()
  }

  // 加载保存的工作区
  private loadFromStorage() {
    const saved = localStorageService.get(StorageKeys.WORKSPACE, null)
    if (saved) {
      this.context = saved
    }
  }

  // 保存到 localStorage
  private saveToStorage() {
    if (this.context) {
      localStorageService.set(StorageKeys.WORKSPACE, this.context)
    } else {
      localStorageService.remove(StorageKeys.WORKSPACE)
    }
  }

  // 获取当前工作区
  getContext(): WorkspaceContext | null {
    return this.context
  }

  // 创建工作区
  createContext(name: string, description?: string): WorkspaceContext {
    this.context = {
      name,
      files: [],
      rootPath: '/',
      description
    }
    this.saveToStorage()
    return this.context
  }

  // 清空工作区
  clearContext() {
    this.context = null
    localStorageService.remove(StorageKeys.WORKSPACE)
  }

  // 添加文件到工作区
  addFile(file: Omit<WorkspaceFile, 'size' | 'lastModified'>): boolean {
    if (!this.context) {
      this.createContext('未命名工作区')
    }

    const content = file.content
    const size = new Blob([content]).size

    // 检查文件大小
    if (size > MAX_FILE_SIZE) {
      throw new Error(`文件 ${file.name} 超过 1MB 限制`)
    }

    // 检查总大小
    const currentSize = this.getTotalSize()
    if (currentSize + size > MAX_TOTAL_SIZE) {
      throw new Error('工作区总大小超过 10MB 限制')
    }

    // 检查文件数
    if (this.context!.files.length >= MAX_FILES) {
      throw new Error('工作区文件数超过 100 个限制')
    }

    // 检查是否已存在
    const existingIndex = this.context!.files.findIndex(f => f.path === file.path)
    
    const workspaceFile: WorkspaceFile = {
      ...file,
      size,
      lastModified: Date.now(),
      selected: true
    }

    if (existingIndex >= 0) {
      this.context!.files[existingIndex] = workspaceFile
    } else {
      this.context!.files.push(workspaceFile)
    }

    this.saveToStorage()
    return true
  }

  // 从本地文件读取并添加到工作区
  async addFileFromLocal(file: File, path?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const filePath = path || file.name
          
          this.addFile({
            name: file.name,
            path: filePath,
            content,
            language: this.detectLanguage(file.name),
            selected: true
          })
          
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error(`读取文件 ${file.name} 失败`))
      reader.readAsText(file)
    })
  }

  // 批量添加文件
  async addFilesFromLocal(files: File[], basePath: string = ''): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] }
    
    for (const file of files) {
      try {
        const path = basePath ? `${basePath}/${file.name}` : file.name
        await this.addFileFromLocal(file, path)
        result.success++
      } catch (e) {
        result.failed++
        result.errors.push(`${file.name}: ${e instanceof Error ? e.message : '未知错误'}`)
      }
    }
    
    return result
  }

  // 从文件夹递归读取
  async addFilesFromDirectory(entry: FileSystemDirectoryEntry, basePath: string = ''): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] }
    
    const reader = entry.createReader()
    const entries: FileSystemEntry[] = []
    
    // 读取所有条目
    let readMore = true
    while (readMore) {
      await new Promise<void>((resolve) => {
        reader.readEntries((items) => {
          if (items.length === 0) {
            readMore = false
          } else {
            entries.push(...items)
          }
          resolve()
        })
      })
    }
    
    // 处理每个条目
    for (const item of entries) {
      const itemPath = basePath ? `${basePath}/${item.name}` : item.name
      
      if (item.isFile) {
        try {
          const file = await new Promise<File>((resolve, reject) => {
            (item as FileSystemFileEntry).file(resolve, reject)
          })
          await this.addFileFromLocal(file, itemPath)
          result.success++
        } catch (e) {
          result.failed++
          result.errors.push(`${itemPath}: ${e instanceof Error ? e.message : '未知错误'}`)
        }
      } else if (item.isDirectory) {
        // 递归处理子目录
        const subResult = await this.addFilesFromDirectory(item as FileSystemDirectoryEntry, itemPath)
        result.success += subResult.success
        result.failed += subResult.failed
        result.errors.push(...subResult.errors)
      }
    }
    
    return result
  }

  // 从现有文件数组创建工作区（用于从App.tsx导入）
  createFromFiles(files: { name: string; content: string; language: string }[], name: string = '导入的项目') {
    this.context = {
      name,
      files: files.map(f => ({
        ...f,
        path: f.name,
        size: new Blob([f.content]).size,
        lastModified: Date.now(),
        selected: true
      })),
      rootPath: '/'
    }
    this.saveToStorage()
  }

  // 删除文件
  removeFile(path: string) {
    if (!this.context) return
    
    const index = this.context.files.findIndex(f => f.path === path)
    if (index >= 0) {
      this.context.files.splice(index, 1)
      this.saveToStorage()
    }
  }

  // 更新文件内容
  updateFile(path: string, content: string) {
    if (!this.context) return
    
    const file = this.context.files.find(f => f.path === path)
    if (file) {
      file.content = content
      file.size = new Blob([content]).size
      file.lastModified = Date.now()
      this.saveToStorage()
    }
  }

  // 切换文件选择状态
  toggleFileSelection(path: string) {
    if (!this.context) return
    
    const file = this.context.files.find(f => f.path === path)
    if (file) {
      file.selected = !file.selected
      this.saveToStorage()
    }
  }

  // 选择/取消选择所有文件
  selectAllFiles(selected: boolean) {
    if (!this.context) return
    
    this.context.files.forEach(f => f.selected = selected)
    this.saveToStorage()
  }

  // 获取选中的文件
  getSelectedFiles(): WorkspaceFile[] {
    if (!this.context) return []
    return this.context.files.filter(f => f.selected !== false)
  }

  // 获取所有文件
  getAllFiles(): WorkspaceFile[] {
    if (!this.context) return []
    return this.context.files
  }

  // 获取文件
  getFile(path: string): WorkspaceFile | undefined {
    if (!this.context) return undefined
    return this.context.files.find(f => f.path === path)
  }

  // 获取总大小
  getTotalSize(): number {
    if (!this.context) return 0
    return this.context.files.reduce((sum, f) => sum + f.size, 0)
  }

  // 获取选中文件的总Token估算（粗略估计）
  getEstimatedTokens(): number {
    const selectedFiles = this.getSelectedFiles()
    // 粗略估计：1 token ≈ 4 字符
    const totalChars = selectedFiles.reduce((sum, f) => sum + f.content.length, 0)
    return Math.ceil(totalChars / 4)
  }

  // 生成AI系统提示 - 包含工作区上下文
  generateSystemPrompt(additionalContext?: string): string {
    const selectedFiles = this.getSelectedFiles()
    
    if (selectedFiles.length === 0) {
      return `你是一个专业的编程助手。${additionalContext || ''}`
    }

    let prompt = `你是一个专业的编程助手。当前工作区包含以下文件：\n\n`
    
    prompt += `## 工作区结构\n\n`
    
    // 先显示文件列表
    selectedFiles.forEach(file => {
      prompt += `- ${file.path} (${file.language})\n`
    })
    
    prompt += `\n## 文件内容\n\n`
    
    // 然后显示每个文件的内容
    selectedFiles.forEach(file => {
      prompt += `### ${file.path}\n\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`
    })
    
    prompt += `## 指令\n\n`
    prompt += `1. 你可以修改以上任何文件\n`
    prompt += `2. 创建新文件时请使用格式: \`\`\`filename.ext\n内容\n\`\`\`\n`
    prompt += `3. 修改现有文件时请输出完整的新文件内容\n`
    prompt += `4. 如果删除文件，请明确说明\n`
    prompt += `5. 如果移动/重命名文件，请说明原路径和新路径\n`
    
    if (additionalContext) {
      prompt += `\n${additionalContext}\n`
    }
    
    return prompt
  }

  // 检测编程语言
  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'md': 'markdown',
      'vue': 'vue',
      'svelte': 'svelte',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'dockerfile': 'dockerfile'
    }
    return map[ext] || 'plaintext'
  }

  // 导出工作区
  exportContext(): string {
    if (!this.context) return ''
    return JSON.stringify(this.context, null, 2)
  }

  // 导入工作区
  importContext(json: string): boolean {
    try {
      const context = JSON.parse(json) as WorkspaceContext
      if (context.files && Array.isArray(context.files)) {
        this.context = context
        this.saveToStorage()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to import workspace context:', e)
      return false
    }
  }

  // 获取工作区统计信息
  getStats() {
    if (!this.context) {
      return {
        totalFiles: 0,
        selectedFiles: 0,
        totalSize: 0,
        estimatedTokens: 0,
        languages: {} as Record<string, number>
      }
    }

    const languages: Record<string, number> = {}
    this.context.files.forEach(f => {
      languages[f.language] = (languages[f.language] || 0) + 1
    })

    return {
      totalFiles: this.context.files.length,
      selectedFiles: this.context.files.filter(f => f.selected !== false).length,
      totalSize: this.getTotalSize(),
      estimatedTokens: this.getEstimatedTokens(),
      languages
    }
  }
}

export const workspaceContextService = new WorkspaceContextService()
