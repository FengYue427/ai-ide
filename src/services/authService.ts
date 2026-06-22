import { createTranslator } from '../i18n'
import type { WorkspaceSanitizeSummary } from '../../lib/api/workspacePayload'
import {
  sanitizeWorkspaceFilesForCloud,
  workspaceSanitizeHadOmissions,
} from '../../lib/api/workspacePayload'
import { unifiedStorage, StorageLayer } from './unifiedStorage'
import { readJsonResponse, apiFetch } from './apiUtils'
import { persistAuthToken, clearAuthToken } from '../lib/desktopAuthToken'
import { trackEvent } from '../lib/observability'
import { pickApiResponseMessage } from '../lib/apiUserMessage'
import { getWorkspaceLocale } from './workspaceErrors'

function at() {
  return createTranslator(getWorkspaceLocale())
}

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

export type WorkspaceCloudSaveResult =
  | { ok: true; summary?: WorkspaceSanitizeSummary }
  | {
      ok: false
      reason:
        | 'not_logged_in'
        | 'payload_too_large'
        | 'storage_limit_reached'
        | 'http_error'
        | 'network_error'
      status?: number
      summary?: WorkspaceSanitizeSummary
      limitGb?: number
    }

const USER_KEY = 'user'
const LOCAL_USERS_KEY = 'ai-ide-local-users'

/** Local-only auth fallback: dev or explicit VITE_ALLOW_OFFLINE_AUTH=true. Never in production builds. */
export function allowOfflineAuthFallback(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_OFFLINE_AUTH === 'true'
}

class AuthService {
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []
  private sessionExpiredHandler: (() => void) | null = null
  private handlingExpiry = false

  constructor() {
    // 初始化时从 unifiedStorage 恢复（缓存）
    this.initFromCache()
  }

  private async initFromCache() {
    const cached = await unifiedStorage.get<{ user: User; expires: string } | null>(USER_KEY, null)
    if (cached && new Date(cached.expires) > new Date()) {
      this.currentUser = cached.user
    }
  }

  private getSessionExpiry(): string {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  private async persistSession(user: User): Promise<Session> {
    const session = { user, expires: this.getSessionExpiry() }
    this.currentUser = user
    await unifiedStorage.set(USER_KEY, session, { layer: StorageLayer.LOCAL })
    this.notifyListeners()
    return session
  }

  private async hashPassword(password: string): Promise<string> {
    if (globalThis.crypto?.subtle) {
      const data = new TextEncoder().encode(password)
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    }
    return btoa(unescape(encodeURIComponent(password)))
  }

  private getLocalUsers(): Array<User & { passwordHash: string }> {
    try {
      const value = localStorage.getItem(LOCAL_USERS_KEY)
      return value ? JSON.parse(value) : []
    } catch {
      return []
    }
  }

  private setLocalUsers(users: Array<User & { passwordHash: string }>) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  }

  private async captureAuthToken(data: { token?: string } | null | undefined): Promise<void> {
    if (data?.token) {
      await persistAuthToken(data.token)
    }
  }

  // 获取当前会话
  async getSession(): Promise<Session | null> {
    try {
      const res = await apiFetch('/api/auth/session', { credentials: 'include' })
      if (res.ok) {
        const data = await readJsonResponse<{ user?: User; token?: string }>(res)
        if (data?.user) {
          await this.captureAuthToken(data)
          return this.persistSession(data.user)
        }
      }
    } catch {
      // 网络错误，使用缓存
    }
    const cached = await unifiedStorage.get<Session | null>(USER_KEY, null)
    if (cached && new Date(cached.expires) > new Date()) {
      this.currentUser = cached.user
      return cached
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
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const res = await apiFetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password }),
      })
      
      if (res.ok) {
        const data = await readJsonResponse<{ user?: User; token?: string }>(res)
        await this.captureAuthToken(data)
        const session = data?.user ? await this.persistSession(data.user) : await this.getSession()
        if (session?.user) {
          trackEvent('auth.login.success', { userId: session.user.id })
          return { success: true, user: session.user }
        }
      } else if (res.status !== 404) {
        const data = await readJsonResponse<{ error?: string }>(res)
        return { success: false, error: data?.error || at()('auth.error.loginFailed') }
      }
    } catch {
      if (!allowOfflineAuthFallback()) {
        return { success: false, error: at()('auth.error.network') }
      }
    }

    if (!allowOfflineAuthFallback()) {
      return { success: false, error: at()('auth.error.loginFailed') }
    }

    const users = this.getLocalUsers()
    const user = users.find((item) => item.email === normalizedEmail)
    if (!user) return { success: false, error: at()('auth.error.accountNotFound') }

    const passwordHash = await this.hashPassword(password)
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: at()('auth.error.loginFailed') }
    }

    const { passwordHash: _passwordHash, ...publicUser } = user
    await this.persistSession(publicUser)
    return { success: true, user: publicUser }
  }

  // 注册
  async register(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password, name }),
      })
      
      if (res.ok) {
        const data = await readJsonResponse<{ user?: User; token?: string }>(res)
        if (data?.user) {
          await this.captureAuthToken(data)
          await this.persistSession(data.user)
          trackEvent('auth.register.success', { userId: data.user.id })
          return { success: true, user: data.user }
        }
      } else if (res.status !== 404) {
        const data = await readJsonResponse<{ error?: string }>(res)
        return { success: false, error: data?.error || at()('auth.error.registerFailed') }
      }
    } catch {
      if (!allowOfflineAuthFallback()) {
        return { success: false, error: at()('auth.error.network') }
      }
    }

    if (!allowOfflineAuthFallback()) {
      return { success: false, error: at()('auth.error.registerFailed') }
    }

    const users = this.getLocalUsers()
    if (users.some((user) => user.email === normalizedEmail)) {
      return { success: false, error: at()('auth.error.emailRegistered') }
    }

    const user: User & { passwordHash: string } = {
      id: `local-${Date.now()}`,
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      passwordHash: await this.hashPassword(password)
    }
    this.setLocalUsers([...users, user])
    const { passwordHash: _passwordHash, ...publicUser } = user
    await this.persistSession(publicUser)
    return { success: true, user: publicUser }
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; error?: string; message?: string; demo?: boolean }> {
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await readJsonResponse<{
        success?: boolean
        error?: string
        message?: string
        messageKey?: string
        demo?: boolean
      }>(res)
      if (res.ok && data?.success) {
        return {
          success: true,
          message: pickApiResponseMessage(data, at()),
          demo: data.demo,
        }
      }
      return { success: false, error: data?.error || at()('auth.error.resetFailed') }
    } catch {
      return { success: false, error: at()('auth.error.network') }
    }
  }

  /** After GitHub/Google redirect, bridge Auth.js session → auth-token cookie. */
  async syncOAuthSession(): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
    try {
      const res = await apiFetch('/api/auth/oauth/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await readJsonResponse<{ user?: User; token?: string; error?: string }>(res)
      if (res.ok && data?.user) {
        await this.captureAuthToken(data)
        await this.persistSession(data.user)
        return { success: true, user: data.user, token: data.token }
      }
      return { success: false, error: data?.error || at()('auth.api.oauthSyncFailed') }
    } catch {
      return { success: false, error: at()('auth.error.network') }
    }
  }

  /** Desktop deep link hands off JWT from browser OAuth completion. */
  async applyBearerTokenFromDeepLink(token: string): Promise<User | null> {
    const trimmed = token.trim()
    if (!trimmed) return null
    await persistAuthToken(trimmed)
    const session = await this.getSession()
    return session?.user ?? null
  }

  onSessionExpired(handler: (() => void) | null): void {
    this.sessionExpiredHandler = handler
  }

  /** JWT/cookie expired — clear local session without calling signout API. */
  async handleSessionExpired(): Promise<void> {
    if (this.handlingExpiry) return
    this.handlingExpiry = true
    try {
      if (!this.currentUser) {
        const cached = await unifiedStorage.get<Session | null>(USER_KEY, null)
        if (!cached?.user) return
      }
      this.currentUser = null
      await unifiedStorage.set(USER_KEY, null, { layer: StorageLayer.LOCAL })
      await clearAuthToken()
      this.notifyListeners()
      this.sessionExpiredHandler?.()
    } finally {
      this.handlingExpiry = false
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      await apiFetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } finally {
      this.currentUser = null
      await unifiedStorage.set(USER_KEY, null, { layer: StorageLayer.LOCAL })
      await clearAuthToken()
      this.notifyListeners()
    }
  }

  // 云同步：保存工作区（大文件在客户端裁剪，避免 413 — v1.1.3.9）
  async saveWorkspace(
    files: Array<{ name: string; content: string; language?: string; id?: string }>,
    settings?: Record<string, unknown>,
    name: string = 'default',
  ): Promise<WorkspaceCloudSaveResult> {
    if (!this.currentUser) {
      return { ok: false, reason: 'not_logged_in' }
    }

    const sanitized = sanitizeWorkspaceFilesForCloud(
      files.map(({ name: fileName, content }) => ({ name: fileName, content })),
    )

    try {
      const res = await apiFetch(`/api/workspaces/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          files: JSON.stringify(sanitized.files),
          settings: JSON.stringify(settings ?? {}),
          name,
        }),
      })

      if (res.status === 413) {
        const body = await readJsonResponse<{ errorKey?: string; limitGb?: string | number }>(res).catch(
          () => null,
        )
        if (body?.errorKey === 'api.storage.limitReached') {
          const limitGb = Number(body.limitGb)
          return {
            ok: false,
            reason: 'storage_limit_reached',
            status: 413,
            limitGb: Number.isFinite(limitGb) ? limitGb : undefined,
            summary: sanitized.summary,
          }
        }
        return {
          ok: false,
          reason: 'payload_too_large',
          summary: sanitized.summary,
        }
      }

      if (!res.ok) {
        return { ok: false, reason: 'http_error', status: res.status, summary: sanitized.summary }
      }

      return {
        ok: true,
        summary: workspaceSanitizeHadOmissions(sanitized.summary) ? sanitized.summary : undefined,
      }
    } catch {
      return { ok: false, reason: 'network_error', summary: sanitized.summary }
    }
  }

  // 云同步：加载工作区
  async loadWorkspace(id: string = 'default'): Promise<{ files: any[]; settings?: any } | null> {
    if (!this.currentUser) {
      return null
    }

    try {
      const res = await apiFetch(`/api/workspaces/${encodeURIComponent(id)}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await readJsonResponse<{ workspace?: { files?: string; settings?: string } }>(res)
        if (data?.workspace) {
          const rawFiles = JSON.parse(data.workspace.files || '[]') as Array<{
            name: string
            content: string
            language?: string
          }>
          return {
            files: rawFiles.map((file) => ({
              name: file.name,
              content: file.content,
              language: file.language || 'plaintext',
            })),
            settings: data.workspace.settings ? JSON.parse(data.workspace.settings) : undefined,
          }
        }
      }
    } catch {
      // 失败返回 null
    }
    return null
  }
}

export const authService = new AuthService()
