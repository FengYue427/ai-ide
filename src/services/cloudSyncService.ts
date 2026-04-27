import { storageService } from './storageService'

export interface WorkspaceBackup {
  id: string
  name: string
  description?: string
  files: {
    name: string
    content: string
    language: string
  }[]
  settings: {
    theme: string
    autoSave: boolean
    language: string
    aiProvider?: string
    aiModel?: string
  }
  createdAt: number
  updatedAt: number
}

const WORKSPACE_KEY = 'ide-workspaces'
const AUTO_BACKUP_KEY = 'ide-auto-backup'

export const cloudSyncService = {
  // 获取所有工作区备份
  async getAllWorkspaces(): Promise<WorkspaceBackup[]> {
    const workspaces = await storageService.getSetting(WORKSPACE_KEY)
    return workspaces || []
  },

  // 保存工作区
  async saveWorkspace(
    name: string,
    files: WorkspaceBackup['files'],
    settings: WorkspaceBackup['settings'],
    description?: string
  ): Promise<WorkspaceBackup> {
    const workspaces = await this.getAllWorkspaces()
    
    const workspace: WorkspaceBackup = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      description,
      files,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    workspaces.push(workspace)
    await storageService.saveSetting(WORKSPACE_KEY, workspaces)
    
    return workspace
  },

  // 更新工作区
  async updateWorkspace(
    id: string,
    updates: Partial<Omit<WorkspaceBackup, 'id' | 'createdAt'>>
  ): Promise<WorkspaceBackup | null> {
    const workspaces = await this.getAllWorkspaces()
    const index = workspaces.findIndex(w => w.id === id)
    
    if (index === -1) return null

    workspaces[index] = {
      ...workspaces[index],
      ...updates,
      updatedAt: Date.now()
    }

    await storageService.saveSetting(WORKSPACE_KEY, workspaces)
    return workspaces[index]
  },

  // 删除工作区
  async deleteWorkspace(id: string): Promise<boolean> {
    const workspaces = await this.getAllWorkspaces()
    const filtered = workspaces.filter(w => w.id !== id)
    
    if (filtered.length === workspaces.length) return false
    
    await storageService.saveSetting(WORKSPACE_KEY, filtered)
    return true
  },

  // 导出工作区为 JSON 文件
  exportWorkspace(workspace: WorkspaceBackup): string {
    return JSON.stringify(workspace, null, 2)
  },

  // 从 JSON 导入工作区
  async importWorkspace(json: string): Promise<WorkspaceBackup | null> {
    try {
      const data = JSON.parse(json)
      
      // 验证数据结构
      if (!data.name || !Array.isArray(data.files)) {
        throw new Error('无效的工作区数据')
      }

      const workspace: WorkspaceBackup = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: data.name + ' (导入)',
        description: data.description,
        files: data.files,
        settings: data.settings || {
          theme: 'vs-dark',
          autoSave: true,
          language: 'zh'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const workspaces = await this.getAllWorkspaces()
      workspaces.push(workspace)
      await storageService.saveSetting(WORKSPACE_KEY, workspaces)
      
      return workspace
    } catch (error) {
      console.error('导入工作区失败:', error)
      return null
    }
  },

  // 自动备份当前工作区
  async autoBackup(
    files: WorkspaceBackup['files'],
    settings: WorkspaceBackup['settings']
  ): Promise<void> {
    const backup: WorkspaceBackup = {
      id: 'auto-backup',
      name: '自动备份',
      description: '系统自动创建的备份',
      files,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await storageService.saveSetting(AUTO_BACKUP_KEY, backup)
  },

  // 获取自动备份
  async getAutoBackup(): Promise<WorkspaceBackup | null> {
    return await storageService.getSetting(AUTO_BACKUP_KEY)
  },

  // 恢复自动备份
  async restoreAutoBackup(): Promise<WorkspaceBackup | null> {
    const backup = await this.getAutoBackup()
    if (!backup) return null

    // 更新备份时间
    backup.updatedAt = Date.now()
    await storageService.saveSetting(AUTO_BACKUP_KEY, backup)
    
    return backup
  },

  // 导出所有数据（完整备份）
  async exportAllData(): Promise<string> {
    const workspaces = await this.getAllWorkspaces()
    const autoBackup = await this.getAutoBackup()
    
    const data = {
      version: '1.0',
      exportTime: Date.now(),
      workspaces,
      autoBackup
    }

    return JSON.stringify(data, null, 2)
  },

  // 导入所有数据
  async importAllData(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json)
      
      if (data.workspaces) {
        await storageService.saveSetting(WORKSPACE_KEY, data.workspaces)
      }
      
      if (data.autoBackup) {
        await storageService.saveSetting(AUTO_BACKUP_KEY, data.autoBackup)
      }
      
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }
}
