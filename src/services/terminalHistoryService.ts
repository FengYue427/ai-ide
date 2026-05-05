// 终端命令历史管理服务
import { unifiedStorage, StorageLayer } from './unifiedStorage'

const MAX_HISTORY = 100
const HISTORY_KEY = 'terminal-history'

export interface CommandHistoryItem {
  command: string
  timestamp: number
  success: boolean
  output?: string
}

export const terminalHistoryService = {
  // 获取命令历史
  async getHistory(): Promise<CommandHistoryItem[]> {
    return await unifiedStorage.get(HISTORY_KEY, [])
  },

  // 保存命令到历史
  async saveCommand(command: string, success: boolean = true, output?: string): Promise<void> {
    const history = await this.getHistory()
    
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

    await unifiedStorage.set(HISTORY_KEY, history, { layer: StorageLayer.LOCAL })
  },

  // 删除单条历史
  async removeCommand(timestamp: number): Promise<void> {
    const history = await this.getHistory()
    const filtered = history.filter(item => item.timestamp !== timestamp)
    await unifiedStorage.set(HISTORY_KEY, filtered, { layer: StorageLayer.LOCAL })
  },

  // 清空历史
  async clearHistory(): Promise<void> {
    await unifiedStorage.set(HISTORY_KEY, [], { layer: StorageLayer.LOCAL })
  },

  // 搜索历史
  async searchHistory(query: string): Promise<CommandHistoryItem[]> {
    const history = await this.getHistory()
    if (!query.trim()) return history
    
    const lowerQuery = query.toLowerCase()
    return history.filter(item => 
      item.command.toLowerCase().includes(lowerQuery)
    )
  },

  // 获取常用命令
  async getFrequentCommands(limit: number = 10): Promise<Array<{ command: string; count: number }>> {
    const history = await this.getHistory()
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
  async exportHistory(): Promise<string> {
    const history = await this.getHistory()
    return JSON.stringify(history, null, 2)
  },

  // 从历史导入
  async importHistory(json: string): Promise<boolean> {
    try {
      const history = JSON.parse(json)
      if (Array.isArray(history)) {
        await unifiedStorage.set(HISTORY_KEY, history, { layer: StorageLayer.LOCAL })
        return true
      }
    } catch (error) {
      console.error('Failed to import history:', error)
    }
    return false
  }
}
