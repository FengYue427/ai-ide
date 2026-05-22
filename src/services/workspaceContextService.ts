/**
 * 工作区上下文服务 - 管理多文件工作区的AI上下文
 * 这是AI IDE的核心优势：让AI理解整个项目结构，而不仅仅是当前文件
 */

import { createTranslator } from '../i18n'
import { unifiedStorage, StorageLayer } from './unifiedStorage'
import {
  buildWorkspaceFileCatalog,
  summarizeFileContent,
} from './workspacePromptUtils'

 type WorkspaceChangeListener = () => void

const WORKSPACE_KEY = 'workspace'

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
  private listeners = new Set<WorkspaceChangeListener>()

  constructor() {
    // 异步初始化
    this.initFromStorage()
  }

  private async initFromStorage() {
    await this.loadFromStorage()
  }

  onChange(listener: WorkspaceChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emitChange() {
    this.listeners.forEach(l => {
      try {
        l()
      } catch (e) {
        console.error('[workspaceContextService] listener error:', e)
      }
    })
  }

  // 加载保存的工作区
  private async loadFromStorage() {
    const saved = await unifiedStorage.get<WorkspaceContext | null>(WORKSPACE_KEY, null)
    if (saved) {
      this.context = saved
    }
  }

  // 保存到 unifiedStorage
  private async saveToStorage() {
    if (this.context) {
      await unifiedStorage.set(WORKSPACE_KEY, this.context, { layer: StorageLayer.INDEXED })
    } else {
      await unifiedStorage.set(WORKSPACE_KEY, null, { layer: StorageLayer.INDEXED })
    }
    this.emitChange()
  }

  // 获取当前工作区
  getContext(): WorkspaceContext | null {
    return this.context
  }

  // 创建工作区
  async createContext(name: string, description?: string): Promise<WorkspaceContext> {
    this.context = {
      name,
      files: [],
      rootPath: '/',
      description
    }
    await this.saveToStorage()
    return this.context
  }

  // 清空工作区
  async clearContext() {
    this.context = null
    await unifiedStorage.set(WORKSPACE_KEY, null, { layer: StorageLayer.INDEXED })
    this.emitChange()
  }

  // 添加文件到工作区
  async addFile(file: Omit<WorkspaceFile, 'size' | 'lastModified'>): Promise<boolean> {
    if (!this.context) {
      await this.createContext('未命名工作区')
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

    await this.saveToStorage()
    return true
  }

  // 从本地文件读取并添加到工作区
  async addFileFromLocal(file: File, path?: string): Promise<void> {
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error(`读取文件 ${file.name} 失败`))
      reader.readAsText(file)
    })
    
    const filePath = path || file.name
    await this.addFile({
      name: file.name,
      path: filePath,
      content,
      language: this.detectLanguage(file.name),
      selected: true
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
  async createFromFiles(files: { name: string; content: string; language: string }[], name: string = '导入的项目') {
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
    await this.saveToStorage()
  }

  // 删除文件
  async removeFile(path: string) {
    if (!this.context) return
    
    const index = this.context.files.findIndex(f => f.path === path)
    if (index >= 0) {
      this.context.files.splice(index, 1)
      await this.saveToStorage()
    }
  }

  // 更新文件内容
  async updateFile(path: string, content: string) {
    if (!this.context) return
    
    const file = this.context.files.find(f => f.path === path)
    if (file) {
      file.content = content
      file.size = new Blob([content]).size
      file.lastModified = Date.now()
      await this.saveToStorage()
    }
  }

  // 切换文件选择状态
  async toggleFileSelection(path: string) {
    if (!this.context) return
    
    const file = this.context.files.find(f => f.path === path)
    if (file) {
      file.selected = !file.selected
      await this.saveToStorage()
    }
  }

  // 选择/取消选择所有文件
  async selectAllFiles(selected: boolean) {
    if (!this.context) return
    
    this.context.files.forEach(f => f.selected = selected)
    await this.saveToStorage()
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

  /** Build AI system prompt with workspace context (locale follows UI language). */
  generateSystemPrompt(additionalContext?: string, locale: Parameters<typeof createTranslator>[0] = 'zh-CN'): string {
    const t = createTranslator(locale)
    const allFiles = this.getAllFiles()
    const selectedFiles = this.getSelectedFiles()
    const selectedPaths = new Set(selectedFiles.map((file) => file.path))

    if (allFiles.length === 0) {
      return additionalContext
        ? t('prompt.ws.emptyAssistantWith', { context: additionalContext })
        : t('prompt.ws.emptyAssistant')
    }

    let prompt = `${t('prompt.ws.intro', { count: allFiles.length })}\n\n`

    prompt += `${t('prompt.ws.catalogTitle')}\n`
    prompt += `${t('prompt.ws.catalogLegend')}\n\n`
    prompt += `${buildWorkspaceFileCatalog(
      allFiles.map((file) => ({
        path: file.path,
        language: file.language,
        size: file.size,
        selected: selectedPaths.has(file.path),
      })),
      locale,
    )}\n\n`

    const unselected = allFiles.filter((file) => !selectedPaths.has(file.path))
    if (unselected.length > 0) {
      prompt += `${t('prompt.ws.unselectedTitle')}\n\n`
      for (const file of unselected) {
        prompt += `### ${file.path}\n\n\`\`\`${file.language}\n${summarizeFileContent(file.content, 8, locale)}\n\`\`\`\n\n`
      }
    }

    if (selectedFiles.length > 0) {
      prompt += `${t('prompt.ws.selectedTitle')}\n\n`
      for (const file of selectedFiles) {
        prompt += `### ${file.path}\n\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`
      }
    }

    prompt += `${t('prompt.ws.instructionsTitle')}\n\n`
    prompt += `${t('prompt.ws.instruction1')}\n`
    prompt += `${t('prompt.ws.instruction2')}\n`
    prompt += `${t('prompt.ws.instruction3')}\n`
    prompt += `${t('prompt.ws.instruction4')}\n`
    prompt += `${t('prompt.ws.instruction5')}\n`

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
  async importContext(json: string): Promise<boolean> {
    try {
      const context = JSON.parse(json) as WorkspaceContext
      if (context.files && Array.isArray(context.files)) {
        this.context = context
        await this.saveToStorage()
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
