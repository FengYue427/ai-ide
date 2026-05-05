/**
 * 统一存储服务 - 智能分层存储策略
 * 
 * 存储分层：
 * - L1 (内存): 用户会话、临时状态
 * - L2 (localStorage): 小数据 < 10KB（主题、配置）
 * - L3 (IndexedDB): 大数据 > 10KB（文件、项目）
 * - L4 (云端): 登录用户的工作区同步
 */

import { storageService as idbService } from './storageService'
import { localStorageService, StorageKeys } from './localStorageService'

// 存储类型定义
export enum StorageLayer {
  MEMORY = 'memory',
  LOCAL = 'local',      // localStorage
  INDEXED = 'indexed',  // IndexedDB
  CLOUD = 'cloud'       // 云同步
}

// 存储项元数据
interface StorageItem<T> {
  data: T
  timestamp: number
  layer: StorageLayer
  size: number
}

// 内存缓存
const memoryCache = new Map<string, StorageItem<any>>()
const CACHE_MAX_AGE_MS = 5 * 60 * 1000 // 5分钟过期

/**
 * 估算数据大小（字节）
 */
function estimateSize(data: any): number {
  try {
    const str = JSON.stringify(data)
    // 对于字符串，每个字符约2字节（UTF-16）
    return str.length * 2
  } catch {
    return Infinity
  }
}

/**
 * 选择最佳存储层
 */
function selectLayer(data: any, preferredLayer?: StorageLayer): StorageLayer {
  if (preferredLayer) return preferredLayer
  
  const size = estimateSize(data)
  
  // < 10KB: localStorage（快速读取）
  if (size < 10 * 1024) return StorageLayer.LOCAL
  
  // >= 10KB: IndexedDB（大容量）
  return StorageLayer.INDEXED
}

/**
 * 统一存储服务
 */
export const unifiedStorage = {
  /**
   * 保存数据（自动选择存储层）
   */
  async set<T>(
    key: string,
    data: T,
    options?: {
      layer?: StorageLayer
      ttl?: number // 过期时间（毫秒）
    }
  ): Promise<boolean> {
    const layer = options?.layer || selectLayer(data)
    const timestamp = Date.now()
    const size = estimateSize(data)
    
    try {
      switch (layer) {
        case StorageLayer.MEMORY:
          memoryCache.set(key, { data, timestamp, layer, size })
          return true
          
        case StorageLayer.LOCAL:
          // 清理过期内存缓存
          memoryCache.delete(key)
          return localStorageService.set(key as any, data)
          
        case StorageLayer.INDEXED:
          // 同时存入内存缓存加速读取
          memoryCache.set(key, { data, timestamp, layer, size })
          
          if (key.startsWith('project:')) {
            // 项目数据
            const projectId = key.replace('project:', '')
            await idbService.saveProject({
              id: projectId,
              name: (data as any)?.name || 'Untitled',
              files: (data as any)?.files || []
            })
          } else {
            // 通用设置
            await idbService.saveSetting(key, data)
          }
          return true
          
        case StorageLayer.CLOUD:
          // 云端存储由 authService 处理
          console.warn('[unifiedStorage] Cloud storage should use authService')
          return false
          
        default:
          return false
      }
    } catch (error) {
      console.error(`[unifiedStorage] Failed to set "${key}":`, error)
      return false
    }
  },

  /**
   * 读取数据（自动按优先级查找）
   */
  async get<T>(
    key: string,
    defaultValue: T,
    options?: {
      preferredLayer?: StorageLayer
    }
  ): Promise<T> {
    // 1. 先查内存缓存
    const cached = memoryCache.get(key)
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < CACHE_MAX_AGE_MS) {
        return cached.data
      }
      // 过期清理
      memoryCache.delete(key)
    }
    
    // 2. 按存储层查找
    const layers = options?.preferredLayer 
      ? [options.preferredLayer]
      : [StorageLayer.MEMORY, StorageLayer.LOCAL, StorageLayer.INDEXED]
    
    for (const layer of layers) {
      try {
        let data: T | null = null
        
        switch (layer) {
          case StorageLayer.LOCAL:
            data = localStorageService.get(key as any, null)
            break
            
          case StorageLayer.INDEXED:
            if (key.startsWith('project:')) {
              const projectId = key.replace('project:', '')
              const project = await idbService.getProject(projectId)
              data = project as T
            } else {
              data = await idbService.getSetting(key)
            }
            break
        }
        
        if (data !== null) {
          // 更新内存缓存
          memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            layer: layer as StorageLayer,
            size: estimateSize(data)
          })
          return data
        }
      } catch (error) {
        console.warn(`[unifiedStorage] Failed to get "${key}" from ${layer}:`, error)
      }
    }
    
    return defaultValue
  },

  /**
   * 删除数据
   */
  async remove(key: string): Promise<boolean> {
    // 清理所有层
    memoryCache.delete(key)
    localStorageService.remove(key as any)
    
    if (key.startsWith('project:')) {
      const projectId = key.replace('project:', '')
      await idbService.deleteProject(projectId)
    } else {
      const db = await idbService.getAllProjects()
      // IndexedDB 删除由 idbService 处理
    }
    
    return true
  },

  /**
   * 批量操作（提升性能）
   */
  async setBatch(items: Array<{ key: string; data: any; layer?: StorageLayer }>): Promise<boolean> {
    const promises = items.map(item => this.set(item.key, item.data, { layer: item.layer }))
    const results = await Promise.all(promises)
    return results.every(r => r)
  },

  /**
   * 获取存储统计
   */
  async getStats(): Promise<{
    memory: number
    local: number
    indexed: number
    total: number
  }> {
    const localUsage = localStorageService.getUsage()
    
    // 估算内存缓存
    let memorySize = 0
    memoryCache.forEach(item => memorySize += item.size)
    
    // IndexedDB 统计
    const projects = await idbService.getAllProjects()
    let indexedSize = 0
    projects.forEach(p => indexedSize += estimateSize(p))
    
    return {
      memory: memorySize,
      local: localUsage.used,
      indexed: indexedSize,
      total: memorySize + localUsage.used + indexedSize
    }
  },

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    memoryCache.forEach((item, key) => {
      if (now - item.timestamp > CACHE_MAX_AGE_MS) {
        memoryCache.delete(key)
        cleaned++
      }
    })
    
    if (cleaned > 0) {
      console.log(`[unifiedStorage] Cleaned ${cleaned} expired cache items`)
    }
  },

  /**
   * 导出所有数据（用于备份）
   */
  async exportAll(): Promise<{
    local: Record<string, any>
    indexed: { projects: any[]; settings: Record<string, any> }
  }> {
    const projects = await idbService.getAllProjects()
    
    // 收集 localStorage 数据
    const local: Record<string, any> = {}
    Object.keys(StorageKeys).forEach(key => {
      const value = localStorageService.get(key as any, null)
      if (value !== null) local[key] = value
    })
    
    return {
      local,
      indexed: {
        projects,
        settings: {} // IndexedDB settings 需要单独读取
      }
    }
  },

  /**
   * 导入数据（用于恢复）
   */
  async importAll(data: {
    local?: Record<string, any>
    indexed?: { projects?: any[] }
  }): Promise<boolean> {
    try {
      // 恢复 localStorage
      if (data.local) {
        Object.entries(data.local).forEach(([key, value]) => {
          localStorageService.set(key as any, value)
        })
      }
      
      // 恢复 IndexedDB 项目
      if (data.indexed?.projects) {
        for (const project of data.indexed.projects) {
          await idbService.saveProject(project)
        }
      }
      
      return true
    } catch (error) {
      console.error('[unifiedStorage] Import failed:', error)
      return false
    }
  }
}

// 定期清理（每5分钟）
setInterval(() => unifiedStorage.cleanup(), 5 * 60 * 1000)

// 页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unifiedStorage.cleanup()
  })
}

export default unifiedStorage
