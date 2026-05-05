import { unifiedStorage, StorageLayer } from './unifiedStorage'

const RECENT_FILES_KEY = 'recent-files'
const RECENT_PROJECTS_KEY = 'recent-projects'
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
    return await unifiedStorage.get(RECENT_FILES_KEY, [])
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
    
    await unifiedStorage.set(RECENT_FILES_KEY, limited, { layer: StorageLayer.LOCAL })
  },

  // 移除最近文件
  async removeRecentFile(name: string): Promise<void> {
    const files = await this.getRecentFiles()
    const filtered = files.filter(f => f.name !== name)
    await unifiedStorage.set(RECENT_FILES_KEY, filtered, { layer: StorageLayer.LOCAL })
  },

  // 清空最近文件
  async clearRecentFiles(): Promise<void> {
    await unifiedStorage.set(RECENT_FILES_KEY, [], { layer: StorageLayer.LOCAL })
  },

  // 获取最近项目
  async getRecentProjects(): Promise<RecentProject[]> {
    return await unifiedStorage.get(RECENT_PROJECTS_KEY, [])
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
    
    await unifiedStorage.set(RECENT_PROJECTS_KEY, limited, { layer: StorageLayer.LOCAL })
  },

  // 移除最近项目
  async removeRecentProject(id: string): Promise<void> {
    const projects = await this.getRecentProjects()
    const filtered = projects.filter(p => p.id !== id)
    await unifiedStorage.set(RECENT_PROJECTS_KEY, filtered, { layer: StorageLayer.LOCAL })
  },

  // 清空最近项目
  async clearRecentProjects(): Promise<void> {
    await unifiedStorage.set(RECENT_PROJECTS_KEY, [], { layer: StorageLayer.LOCAL })
  }
}
