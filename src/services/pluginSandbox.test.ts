import { describe, expect, it } from 'vitest'
import { createSandboxedContext, validateManifest, validatePluginSource } from './pluginSandbox'
import type { PluginContext } from './pluginTypes'

const fullContext: PluginContext = {
  locale: 'zh-CN',
  t: (key) => key,
  editor: {
    getValue: () => '',
    setValue: () => {},
    getSelectedText: () => null,
    insertText: () => {},
  },
  files: {
    getAll: () => [],
    getActive: () => null,
    create: () => {},
    open: () => {},
  },
  terminal: { execute: async () => '', getHistory: () => [] },
  ai: { complete: async () => '', getMode: () => 'unconfigured' as const },
  debug: {
    getSummary: () => ({ active: false, phase: 'idle', runtimeKind: null, syncMode: null }),
  },
  ui: {
    showNotification: () => {},
    showModal: () => {},
    addToolbarButton: () => {},
  },
}

describe('pluginSandbox', () => {
  it('rejects dangerous plugin source', () => {
    expect(validatePluginSource('fetch("http://evil")')).toMatch(/不允许/)
  })

  it('validates manifest id format', () => {
    expect(
      validateManifest({
        id: 'BAD',
        name: 'x',
        version: '1',
        description: 'd',
        entry: 'main.js',
        permissions: ['ui'],
      }),
    ).toBeTruthy()
  })

  it('denies editor API without permission', () => {
    const sandboxed = createSandboxedContext(fullContext, ['ui'])
    expect(() => sandboxed.editor.getValue()).toThrow(/无权/)
  })

  it('allows editor read but denies write with editor:read only', () => {
    const sandboxed = createSandboxedContext(fullContext, ['editor:read'])
    expect(sandboxed.editor.getValue()).toBe('')
    expect(() => sandboxed.editor.setValue('x')).toThrow(/无权/)
  })

  it('blocks unsafe terminal commands in terminal:safe mode', async () => {
    const sandboxed = createSandboxedContext(fullContext, ['terminal:safe'])
    await expect(sandboxed.terminal.execute('curl https://evil.test')).rejects.toThrow(/无权/)
  })

  it('rejects invalid sdkVersion in manifests', () => {
    expect(
      validateManifest({
        id: 'bad-sdk',
        name: 'x',
        version: '1',
        description: 'd',
        entry: 'main.js',
        permissions: ['ui'],
        sdkVersion: 9,
      }),
    ).toMatch(/sdkVersion/i)
  })

  it('denies debug API without debug:read permission', () => {
    const sandboxed = createSandboxedContext(fullContext, ['ai', 'ui'])
    expect(() => sandboxed.debug.getSummary()).toThrow(/无权|denied/i)
  })

  it('allows debug summary with debug:read permission', () => {
    const sandboxed = createSandboxedContext(fullContext, ['debug:read'])
    expect(sandboxed.debug.getSummary().phase).toBe('idle')
  })

  it('rejects legacy terminal full permission in manifests', () => {
    expect(
      validateManifest({
        id: 'bad-term',
        name: 'x',
        version: '1',
        description: 'd',
        entry: 'main.js',
        permissions: ['terminal', 'ui'],
      }),
    ).toMatch(/terminal:safe/)
  })
})
