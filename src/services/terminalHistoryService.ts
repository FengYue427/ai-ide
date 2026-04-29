// 终端命令历史管理服务
import { localStorageService, StorageKeys } from './localStorageService'

const MAX_HISTORY = 100

export interface CommandHistoryItem {
  command: string
  timestamp: number
  success: boolean
  output?: string
}

export const terminalHistoryService = {
  // 获取命令历史
  getHistory(): CommandHistoryItem[] {
    return localStorageService.get(StorageKeys.TERMINAL_HISTORY, [])
  },

  // 保存命令到历史
  saveCommand(command: string, success: boolean = true, output?: string): void {
    const history = this.getHistory()
    
    // 避免重复保存相同的连续命令
    if (history.length > 0 && history[0].command === command) {
      return
    }

    const newItem: CommandHistoryItem = {
      command: command.trim(),
      timestamp: Date.now(),
      success,
      output: output?.slice(0, 500) // 限制输出长度
    }

    history.unshift(newItem)

    // 限制历史记录数量
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY
    }

    localStorageService.set(StorageKeys.TERMINAL_HISTORY, history)
  },

  // 删除单条历史
  removeCommand(timestamp: number): void {
    const history = this.getHistory()
    const filtered = history.filter(item => item.timestamp !== timestamp)
    localStorageService.set(StorageKeys.TERMINAL_HISTORY, filtered)
  },

  // 清空历史
  clearHistory(): void {
    localStorageService.remove(StorageKeys.TERMINAL_HISTORY)
  },

  // 搜索历史
  searchHistory(query: string): CommandHistoryItem[] {
    const history = this.getHistory()
    if (!query.trim()) return history
    
    const lowerQuery = query.toLowerCase()
    return history.filter(item => 
      item.command.toLowerCase().includes(lowerQuery)
    )
  },

  // 获取常用命令
  getFrequentCommands(limit: number = 10): Array<{ command: string; count: number }> {
    const history = this.getHistory()
    const counts = new Map<string, number>()

    history.forEach(item => {
      counts.set(item.command, (counts.get(item.command) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  },

  // 导出历史为 JSON
  exportHistory(): string {
    const history = this.getHistory()
    return JSON.stringify(history, null, 2)
  },

  // 从历史导入
  importHistory(json: string): boolean {
    try {
      const history = JSON.parse(json)
      if (Array.isArray(history)) {
        localStorageService.set(StorageKeys.TERMINAL_HISTORY, history)
        return true
      }
    } catch (error) {
      console.error('Failed to import history:', error)
    }
    return false
  }
}
