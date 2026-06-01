import { describe, expect, it, vi } from 'vitest'
import { createPluginContext } from './pluginContext'
import type { AIConfig } from './aiService'
import type { DebugSessionState } from '../store/ideStore'

vi.mock('./aiService', () => ({
  sendMessage: vi.fn(async () => 'ok'),
}))

import { sendMessage } from './aiService'

const baseConfig: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  model: 'deepseek-v4-flash',
  keyMode: 'platform',
}

const idleDebug: DebugSessionState = {
  phase: 'idle',
  runtimeKind: null,
  entryFile: null,
  inspectUrl: null,
  error: null,
  syncMode: null,
  registeredBreakpointCount: 0,
  pausedAt: null,
  callStack: [],
  locals: [],
  activeStackFrameIndex: 0,
}

function makeContext(overrides?: {
  config?: AIConfig
  loggedIn?: boolean
  debug?: DebugSessionState
}) {
  return createPluginContext({
    getFiles: () => [],
    getActiveFileIndex: () => 0,
    setFiles: () => {},
    setActiveFile: () => {},
    getAiConfig: () => overrides?.config ?? baseConfig,
    isLoggedIn: () => overrides?.loggedIn ?? true,
    getDebugSession: () => overrides?.debug ?? idleDebug,
    notify: () => {},
    showModal: () => {},
    addToolbarButton: () => {},
  })
}

describe('pluginContext SDK v2', () => {
  it('reports platform mode when gateway and logged in', () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    const ctx = makeContext({ loggedIn: true })
    expect(ctx.ai.getMode()).toBe('platform')
    vi.unstubAllEnvs()
  })

  it('reports unconfigured when platform mode but guest', () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    const ctx = makeContext({ loggedIn: false })
    expect(ctx.ai.getMode()).toBe('unconfigured')
    vi.unstubAllEnvs()
  })

  it('complete uses sendMessage when configured', async () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    const ctx = makeContext({ loggedIn: true })
    await expect(ctx.ai.complete('hi')).resolves.toBe('ok')
    expect(sendMessage).toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('rejects complete when platform guest', async () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    const ctx = makeContext({ loggedIn: false })
    await expect(ctx.ai.complete('hi')).rejects.toThrow(/登录|sign-in/i)
    vi.unstubAllEnvs()
  })

  it('debug summary reflects session phase', () => {
    const ctx = makeContext({
      debug: { ...idleDebug, phase: 'paused', runtimeKind: 'desktop', syncMode: 'cdp' },
    })
    const summary = ctx.debug.getSummary()
    expect(summary.active).toBe(true)
    expect(summary.phase).toBe('paused')
    expect(summary.runtimeKind).toBe('desktop')
    expect(summary.syncMode).toBe('cdp')
  })
})
