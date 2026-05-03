/**
 * LocalStorage 集中管理服务
 * 
 * 解决痛点：
 * 1. Safari 隐私模式下 localStorage 会抛出异常
 * 2. 键名分散在代码各处，容易冲突
 * 3. 缺少统一的错误处理和类型安全
 */

const STORAGE_PREFIX = 'ai-ide:'

// 所有存储键名集中定义
export const StorageKeys = {
  THEME: 'theme',
  LANGUAGE: 'language',
  AI_CONFIG: 'ai-config',
  COLLAB_USERNAME: 'collab_username',
  WORKSPACE: 'workspace',
  TERMINAL_HISTORY: 'terminal-history',
  SETTINGS: 'settings',
  RECENT_FILES: 'recent-files',
  USER: 'user', // 缓存登录用户会话
} as const

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys]

/**
 * 检查 localStorage 是否可用（处理 Safari 隐私模式）
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 安全的 localStorage 包装器
 */
export const localStorageService = {
  isAvailable: isStorageAvailable(),

  /**
   * 获取存储项（带类型安全）
   */
  get<T>(key: StorageKey, defaultValue: T): T {
    if (!this.isAvailable) return defaultValue
    
    try {
      const prefixedKey = STORAGE_PREFIX + key
      const item = localStorage.getItem(prefixedKey)
      
      if (item === null) return defaultValue
      
      return JSON.parse(item) as T
    } catch (error) {
      console.warn(`[localStorage] Failed to get "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * 设置存储项
   */
  set<T>(key: StorageKey, value: T): boolean {
    if (!this.isAvailable) {
      console.warn('[localStorage] Storage not available (Safari Private Mode?)')
      return false
    }
    
    try {
      const prefixedKey = STORAGE_PREFIX + key
      localStorage.setItem(prefixedKey, JSON.stringify(value))
      return true
    } catch (error) {
      // 处理存储配额超出
      if ((error as Error).name === 'QuotaExceededError') {
        console.error(`[localStorage] Storage quota exceeded for "${key}"`)
        // 尝试清理旧数据
        this.cleanup()
      } else {
        console.error(`[localStorage] Failed to set "${key}":`, error)
      }
      return false
    }
  },

  /**
   * 移除存储项
   */
  remove(key: StorageKey): boolean {
    if (!this.isAvailable) return false
    
    try {
      const prefixedKey = STORAGE_PREFIX + key
      localStorage.removeItem(prefixedKey)
      return true
    } catch (error) {
      console.error(`[localStorage] Failed to remove "${key}":`, error)
      return false
    }
  },

  /**
   * 清理所有以 ai-ide: 开头的存储项
   */
  clear(): boolean {
    if (!this.isAvailable) return false
    
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log(`[localStorage] Cleared ${keysToRemove.length} items`)
      return true
    } catch (error) {
      console.error('[localStorage] Failed to clear:', error)
      return false
    }
  },

  /**
   * 清理旧数据（当存储超出时）
   */
  cleanup(): void {
    if (!this.isAvailable) return
    
    try {
      // 保留优先级高的数据，删除优先级低的
      const lowPriorityKeys = [
        StorageKeys.TERMINAL_HISTORY,
        StorageKeys.RECENT_FILES,
      ]
      
      lowPriorityKeys.forEach(key => {
        const prefixedKey = STORAGE_PREFIX + key
        if (localStorage.getItem(prefixedKey)) {
          console.log(`[localStorage] Cleaning up "${key}" to free space`)
          localStorage.removeItem(prefixedKey)
        }
      })
    } catch (error) {
      console.error('[localStorage] Cleanup failed:', error)
    }
  },

  /**
   * 获取存储使用情况
   */
  getUsage(): { used: number; total: number; percentage: number } {
    if (!this.isAvailable) {
      return { used: 0, total: 0, percentage: 0 }
    }
    
    try {
      let used = 0
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          used += key.length + value.length
        }
      }
      
      // 估算：大多数浏览器限制 5-10MB
      const estimatedTotal = 5 * 1024 * 1024 // 5MB
      
      return {
        used,
        total: estimatedTotal,
        percentage: Math.round((used / estimatedTotal) * 100)
      }
    } catch (error) {
      console.error('[localStorage] Failed to get usage:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }
}

export default localStorageService
