import { DEFAULT_LANGUAGE } from '../lib/language'
import { serviceText } from '../lib/serviceI18n'
import { StorageLayer, unifiedStorage } from './unifiedStorage'

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

const WORKSPACE_KEY = 'workspaces'
const AUTO_BACKUP_KEY = 'auto-backup'

const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

export const cloudSyncService = {
  async getAllWorkspaces(): Promise<WorkspaceBackup[]> {
    return unifiedStorage.get(WORKSPACE_KEY, [])
  },

  async getWorkspaceById(id: string): Promise<WorkspaceBackup | null> {
    const workspaces = await cloudSyncService.getAllWorkspaces()
    return workspaces.find((workspace) => workspace.id === id) ?? null
  },

  async saveWorkspace(
    name: string,
    files: WorkspaceBackup['files'],
    settings: WorkspaceBackup['settings'],
    description?: string,
  ): Promise<WorkspaceBackup> {
    const workspaces = await cloudSyncService.getAllWorkspaces()
    const workspace: WorkspaceBackup = {
      id: createId(),
      name,
      description,
      files,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    workspaces.push(workspace)
    await unifiedStorage.set(WORKSPACE_KEY, workspaces, { layer: StorageLayer.INDEXED })
    return workspace
  },

  async updateWorkspace(
    id: string,
    updates: Partial<Omit<WorkspaceBackup, 'id' | 'createdAt'>>,
  ): Promise<WorkspaceBackup | null> {
    const workspaces = await cloudSyncService.getAllWorkspaces()
    const index = workspaces.findIndex((workspace) => workspace.id === id)
    if (index === -1) return null

    workspaces[index] = {
      ...workspaces[index],
      ...updates,
      updatedAt: Date.now(),
    }

    await unifiedStorage.set(WORKSPACE_KEY, workspaces, { layer: StorageLayer.INDEXED })
    return workspaces[index]
  },

  async deleteWorkspace(id: string): Promise<boolean> {
    const workspaces = await cloudSyncService.getAllWorkspaces()
    const filtered = workspaces.filter((workspace) => workspace.id !== id)
    if (filtered.length === workspaces.length) return false

    await unifiedStorage.set(WORKSPACE_KEY, filtered, { layer: StorageLayer.INDEXED })
    return true
  },

  exportWorkspace(workspace: WorkspaceBackup): string {
    return JSON.stringify(workspace, null, 2)
  },

  async importWorkspace(json: string): Promise<WorkspaceBackup | null> {
    try {
      const data = JSON.parse(json)
      if (!data.name || !Array.isArray(data.files)) {
        throw new Error(serviceText('workspace.invalidData'))
      }

      const workspace: WorkspaceBackup = {
        id: createId(),
        name: `${data.name}${serviceText('workspace.importSuffix')}`,
        description: data.description,
        files: data.files,
        settings: data.settings || {
          theme: 'vs-dark',
          autoSave: true,
          language: DEFAULT_LANGUAGE,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const workspaces = await cloudSyncService.getAllWorkspaces()
      workspaces.push(workspace)
      await unifiedStorage.set(WORKSPACE_KEY, workspaces, { layer: StorageLayer.INDEXED })
      return workspace
    } catch (error) {
      console.error('导入工作区失败:', error)
      return null
    }
  },

  async autoBackup(files: WorkspaceBackup['files'], settings: WorkspaceBackup['settings']): Promise<void> {
    const backup: WorkspaceBackup = {
      id: 'auto-backup',
      name: serviceText('workspace.autoBackup.name'),
      description: serviceText('workspace.autoBackup.desc'),
      files,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await unifiedStorage.set(AUTO_BACKUP_KEY, backup, { layer: StorageLayer.INDEXED })
  },

  async getAutoBackup(): Promise<WorkspaceBackup | null> {
    return unifiedStorage.get(AUTO_BACKUP_KEY, null)
  },

  async restoreAutoBackup(): Promise<WorkspaceBackup | null> {
    const backup = await cloudSyncService.getAutoBackup()
    if (!backup) return null

    backup.updatedAt = Date.now()
    await unifiedStorage.set(AUTO_BACKUP_KEY, backup, { layer: StorageLayer.INDEXED })
    return backup
  },

  async exportAllData(): Promise<string> {
    const workspaces = await cloudSyncService.getAllWorkspaces()
    const autoBackup = await cloudSyncService.getAutoBackup()
    return JSON.stringify(
      {
        version: '1.0',
        exportTime: Date.now(),
        workspaces,
        autoBackup,
      },
      null,
      2,
    )
  },

  async importAllData(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json)
      if (data.workspaces) {
        await unifiedStorage.set(WORKSPACE_KEY, data.workspaces, { layer: StorageLayer.INDEXED })
      }
      if (data.autoBackup) {
        await unifiedStorage.set(AUTO_BACKUP_KEY, data.autoBackup, { layer: StorageLayer.INDEXED })
      }
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  },
}
