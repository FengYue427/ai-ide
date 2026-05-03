import { localStorageService, StorageKeys } from './localStorageService'

export interface User {
  id: string
  email: string
  name?: string
  image?: string
}

export interface Session {
  user: User
  expires: string
}

class AuthService {
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  constructor() {
    // 初始化时从 localStorage 恢复（缓存）
    const cached = localStorageService.get<{ user: User; expires: string } | null>(StorageKeys.USER, null)
    if (cached && new Date(cached.expires) > new Date()) {
      this.currentUser = cached.user
    }
  }

  // 获取当前会话
  async getSession(): Promise<Session | null> {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const session = await res.json()
        if (session?.user) {
          this.currentUser = session.user
          localStorageService.set(StorageKeys.USER, session)
          this.notifyListeners()
          return session
        }
      }
    } catch {
      // 网络错误，使用缓存
    }
    return null
  }

  // 检查是否登录
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return !!session?.user
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    return this.currentUser
  }

  // 订阅用户状态变化
  onAuthChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback)
    // 立即回调当前状态
    callback(this.currentUser)
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser))
  }

  // 登录（邮箱+密码）
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (res.ok) {
        await this.getSession() // 刷新会话
        return { success: true }
      } else {
        return { success: false, error: '邮箱或密码错误' }
      }
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  // 注册
  async register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      if (res.ok) {
        return { success: true }
      } else {
        const data = await res.json()
        return { success: false, error: data.error || '注册失败' }
      }
    } catch {
      return { success: false, error: '网络错误' }
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } finally {
      this.currentUser = null
      localStorageService.remove(StorageKeys.USER)
      this.notifyListeners()
    }
  }

  // 云同步：保存工作区
  async saveWorkspace(files: any[], settings?: any, name: string = 'default'): Promise<boolean> {
    if (!this.currentUser) {
      // 未登录，保存到本地
      return false
    }

    try {
      const res = await fetch(`/api/workspaces/default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: JSON.stringify(files), settings: JSON.stringify(settings), name })
      })
      return res.ok
    } catch {
      return false
    }
  }

  // 云同步：加载工作区
  async loadWorkspace(id: string = 'default'): Promise<{ files: any[]; settings?: any } | null> {
    if (!this.currentUser) {
      return null
    }

    try {
      const res = await fetch(`/api/workspaces/${id}`)
      if (res.ok) {
        const data = await res.json()
        return {
          files: JSON.parse(data.workspace.files || '[]'),
          settings: data.workspace.settings ? JSON.parse(data.workspace.settings) : undefined
        }
      }
    } catch {
      // 失败返回 null
    }
    return null
  }
}

export const authService = new AuthService()
