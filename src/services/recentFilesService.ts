import { storageService } from './storageService'

const RECENT_FILES_KEY = 'ide-recent-files'
const RECENT_PROJECTS_KEY = 'ide-recent-projects'
const MAX_RECENT = 10

export interface RecentFile {
  name: string
  language: string
  lastOpened: number
  content?: string
}

export interface RecentProject {
  id: string
  name: string
  lastOpened: number
  fileCount: number
  workspaceId?: string
}

export const recentFilesService = {
  // 获取最近文件
  async getRecentFiles(): Promise<RecentFile[]> {
    const files = await storageService.getSetting(RECENT_FILES_KEY)
    return files || []
  },

  // 添加最近文件
  async addRecentFile(file: Omit<RecentFile, 'lastOpened'>): Promise<void> {
    const files = await this.getRecentFiles()
    
    // 移除重复项
    const filtered = files.filter(f => f.name !== file.name)
    
    // 添加到开头
    filtered.unshift({
      ...file,
      lastOpened: Date.now()
    })
    
    // 限制数量
    const limited = filtered.slice(0, MAX_RECENT)
    
    await storageService.saveSetting(RECENT_FILES_KEY, limited)
  },

  // 移除最近文件
  async removeRecentFile(name: string): Promise<void> {
    const files = await this.getRecentFiles()
    const filtered = files.filter(f => f.name !== name)
    await storageService.saveSetting(RECENT_FILES_KEY, filtered)
  },

  // 清空最近文件
  async clearRecentFiles(): Promise<void> {
    await storageService.saveSetting(RECENT_FILES_KEY, [])
  },

  // 获取最近项目
  async getRecentProjects(): Promise<RecentProject[]> {
    const projects = await storageService.getSetting(RECENT_PROJECTS_KEY)
    return projects || []
  },

  // 添加最近项目
  async addRecentProject(project: Omit<RecentProject, 'lastOpened'>): Promise<void> {
    const projects = await this.getRecentProjects()
    
    // 移除重复项
    const filtered = projects.filter(p => p.id !== project.id)
    
    // 添加到开头
    filtered.unshift({
      ...project,
      lastOpened: Date.now()
    })
    
    // 限制数量
    const limited = filtered.slice(0, MAX_RECENT)
    
    await storageService.saveSetting(RECENT_PROJECTS_KEY, limited)
  },

  // 移除最近项目
  async removeRecentProject(id: string): Promise<void> {
    const projects = await this.getRecentProjects()
    const filtered = projects.filter(p => p.id !== id)
    await storageService.saveSetting(RECENT_PROJECTS_KEY, filtered)
  },

  // 清空最近项目
  async clearRecentProjects(): Promise<void> {
    await storageService.saveSetting(RECENT_PROJECTS_KEY, [])
  }
}
