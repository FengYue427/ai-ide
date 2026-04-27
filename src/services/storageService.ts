import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface IDEFile {
  name: string
  content: string
  language: string
  lastModified: number
}

interface IDEProject {
  id: string
  name: string
  files: IDEFile[]
  createdAt: number
  updatedAt: number
}

interface AIIDE_DB extends DBSchema {
  projects: {
    key: string
    value: IDEProject
  }
  settings: {
    key: string
    value: any
  }
}

const DB_NAME = 'ai-ide-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<AIIDE_DB>> | null = null

async function getDB(): Promise<IDBPDatabase<AIIDE_DB>> {
  if (!dbPromise) {
    dbPromise = openDB<AIIDE_DB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
      }
    })
  }
  return dbPromise
}

export const storageService = {
  // 保存项目
  async saveProject(project: Omit<IDEProject, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDB()
    const now = Date.now()
    const existing = await db.get('projects', project.id)
    
    await db.put('projects', {
      ...project,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    })
  },

  // 获取项目
  async getProject(id: string): Promise<IDEProject | undefined> {
    const db = await getDB()
    return db.get('projects', id)
  },

  // 获取所有项目
  async getAllProjects(): Promise<IDEProject[]> {
    const db = await getDB()
    return db.getAll('projects')
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('projects', id)
  },

  // 自动保存当前项目
  async autoSave(files: IDEFile[], projectId: string = 'default'): Promise<void> {
    await this.saveProject({
      id: projectId,
      name: '自动保存项目',
      files
    })
  },

  // 加载自动保存的项目
  async loadAutoSave(projectId: string = 'default'): Promise<IDEFile[] | null> {
    const project = await this.getProject(projectId)
    return project?.files || null
  },

  // 保存设置
  async saveSetting(key: string, value: any): Promise<void> {
    const db = await getDB()
    await db.put('settings', value, key)
  },

  // 获取设置
  async getSetting(key: string): Promise<any> {
    const db = await getDB()
    return db.get('settings', key)
  },

  // 导出项目为 ZIP
  async exportToZip(projectId: string): Promise<Blob | null> {
    const project = await this.getProject(projectId)
    if (!project) return null

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const file of project.files) {
      zip.file(file.name, file.content)
    }

    return zip.generateAsync({ type: 'blob' })
  }
}
