import { describe, expect, it } from 'vitest'
import { createSandboxedContext, validateManifest, validatePluginSource } from './pluginSandbox'
import type { PluginContext } from './pluginTypes'

const fullContext: PluginContext = {
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
  ai: { complete: async () => '' },
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
})
