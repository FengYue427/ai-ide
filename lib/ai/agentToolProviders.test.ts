import { describe, expect, it } from 'vitest'
import {
  getAgentToolAdapterKind,
  listAgentToolProviders,
  supportsAgentToolProvider,
} from './agentToolProviders'

describe('agentToolProviders', () => {
  it('lists all cloud agent tool providers', () => {
    expect(listAgentToolProviders()).toEqual([
      'openai',
      'deepseek',
      'grok',
      'zhipu',
      'minimax',
      'qwen',
      'claude',
      'google',
    ])
  })

  it('maps providers to adapter kinds', () => {
    expect(getAgentToolAdapterKind('qwen')).toBe('openai')
    expect(getAgentToolAdapterKind('claude')).toBe('anthropic')
    expect(getAgentToolAdapterKind('google')).toBe('gemini')
    expect(getAgentToolAdapterKind('ollama')).toBeNull()
  })

  it('supports known providers only', () => {
    expect(supportsAgentToolProvider('minimax')).toBe(true)
    expect(supportsAgentToolProvider('ollama')).toBe(false)
  })
})
