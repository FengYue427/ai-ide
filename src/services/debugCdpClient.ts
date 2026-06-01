import { buildCdpBreakpointAttempts } from '../lib/debugBreakpointPatterns'
import type { DebugBreakpoint } from '../lib/debugBreakpoints'

export interface CdpPendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export interface CdpPausedLocation {
  path: string
  line: number
}

type CdpNotificationHandler = (method: string, params: unknown) => void
type CdpDisconnectHandler = () => void

/** Minimal Chrome DevTools Protocol client for Node inspect (v1.1.7 F2). */
export class DebugCdpClient {
  private ws: WebSocket | null = null
  private nextId = 1
  private readonly pending = new Map<number, CdpPendingRequest>()
  private notificationHandler: CdpNotificationHandler | null = null
  private disconnectHandler: CdpDisconnectHandler | null = null

  connect(inspectUrl: string, timeoutMs = 8_000): Promise<void> {
    if (typeof WebSocket === 'undefined') {
      return Promise.reject(new Error('WebSocket unavailable'))
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(inspectUrl)
      this.ws = ws
      let settled = false

      const timer = window.setTimeout(() => {
        if (settled) return
        settled = true
        ws.close()
        reject(new Error('CDP connect timeout'))
      }, timeoutMs)

      ws.onopen = () => {
        settled = true
        window.clearTimeout(timer)
        resolve()
      }

      ws.onerror = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        reject(new Error('CDP connect failed'))
      }

      ws.onmessage = (event) => {
        this.handleMessage(String(event.data))
      }

      ws.onclose = () => {
        this.ws = null
        for (const pending of this.pending.values()) {
          pending.reject(new Error('CDP socket closed'))
        }
        this.pending.clear()
        this.disconnectHandler?.()
      }
    })
  }

  onNotification(handler: CdpNotificationHandler): void {
    this.notificationHandler = handler
  }

  onDisconnect(handler: CdpDisconnectHandler): void {
    this.disconnectHandler = handler
  }

  close(): void {
    this.ws?.close()
    this.ws = null
  }

  async send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('CDP not connected')
    }

    const id = this.nextId++
    const payload = JSON.stringify({ id, method, params: params ?? {} })

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      })
      this.ws?.send(payload)
    })
  }

  private handleMessage(raw: string): void {
    let message: {
      id?: number
      method?: string
      params?: unknown
      result?: unknown
      error?: { message?: string }
    }

    try {
      message = JSON.parse(raw) as typeof message
    } catch {
      return
    }

    if (message.id !== undefined) {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) {
        pending.reject(new Error(message.error.message ?? 'CDP error'))
        return
      }
      pending.resolve(message.result)
      return
    }

    if (message.method) {
      this.notificationHandler?.(message.method, message.params)
    }
  }
}

export function parseCdpPausedLocation(params: unknown): CdpPausedLocation | null {
  if (!params || typeof params !== 'object') return null
  const callFrames = (params as { callFrames?: unknown }).callFrames
  if (!Array.isArray(callFrames) || callFrames.length === 0) return null
  const top = callFrames[0] as { url?: string; lineNumber?: number }
  const url = typeof top.url === 'string' ? top.url : ''
  const fileName = url.split(/[/\\]/).pop() ?? url
  const line = typeof top.lineNumber === 'number' ? top.lineNumber + 1 : 1
  return { path: fileName, line }
}

export async function registerBreakpointsOnDebugger(
  client: DebugCdpClient,
  breakpoints: DebugBreakpoint[],
): Promise<number> {
  const enabled = breakpoints.filter((bp) => bp.enabled)
  let registered = 0

  for (const breakpoint of enabled) {
    const attempts = buildCdpBreakpointAttempts(breakpoint)
    let placed = false
    for (const params of attempts) {
      try {
        await client.send('Debugger.setBreakpointByUrl', { ...params } as Record<string, unknown>)
        placed = true
        break
      } catch {
        /* try next url pattern */
      }
    }
    if (placed) registered += 1
  }

  return registered
}

export async function bootstrapDebuggerSession(
  client: DebugCdpClient,
  breakpoints: DebugBreakpoint[],
): Promise<number> {
  await client.send('Runtime.enable')
  await client.send('Debugger.enable')
  const registered = await registerBreakpointsOnDebugger(client, breakpoints)
  await client.send('Debugger.resume')
  return registered
}

export async function tryOpenDebuggerSession(
  inspectUrl: string,
  breakpoints: DebugBreakpoint[],
  options?: { connectTimeoutMs?: number; retryCount?: number },
): Promise<{ client: DebugCdpClient; registered: number } | null> {
  const retries = options?.retryCount ?? 1
  const connectTimeoutMs = options?.connectTimeoutMs ?? 8_000

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const client = new DebugCdpClient()
    try {
      await client.connect(inspectUrl, connectTimeoutMs)
      const registered = await bootstrapDebuggerSession(client, breakpoints)
      return { client, registered }
    } catch {
      client.close()
      if (attempt < retries) {
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
    }
  }

  return null
}
