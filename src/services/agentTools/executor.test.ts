import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../workspaceContextService', () => ({
  workspaceContextService: {
    getAllFiles: vi.fn(() => [{ path: 'hello.ts', content: 'export const x = 1', language: 'typescript' }]),
    getFile: vi.fn((path: string) =>
      path === 'hello.ts'
        ? { path: 'hello.ts', content: 'export const x = 1', language: 'typescript' }
        : undefined,
    ),
    updateFile: vi.fn(),
    addFile: vi.fn(),
  },
}))

vi.mock('../localProjectService', () => ({
  localProjectService: {
    isBound: vi.fn(() => false),
    listFiles: vi.fn(),
    readFile: vi.fn(),
  },
}))

vi.mock('../localProjectSync', () => ({
  syncToLocalDisk: vi.fn(),
}))

vi.mock('../projectIndexManager', () => ({
  projectIndexManager: {
    getIndex: vi.fn(() => ({ files: [], builtAt: 0 })),
    patchFile: vi.fn(),
  },
}))

vi.mock('../terminalBridge', () => ({
  isTerminalBridgeReady: vi.fn(() => false),
  runTerminalCommand: vi.fn(),
}))

vi.mock('../desktopBridge', () => ({
  isDesktopApp: vi.fn(() => false),
}))

import { workspaceContextService } from '../workspaceContextService'
import { executeAgentTool } from './executor'

describe('executeAgentTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('list_files from workspace', async () => {
    const result = await executeAgentTool({ name: 'list_files', arguments: { max: 10 } })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('hello.ts')
  })

  it('read_file from workspace', async () => {
    const result = await executeAgentTool({
      name: 'read_file',
      arguments: { path: 'hello.ts' },
    })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('export const x')
  })

  it('write_file updates workspace', async () => {
    const result = await executeAgentTool({
      name: 'write_file',
      arguments: { path: 'new.ts', content: 'const y = 2' },
    })
    expect(result.ok).toBe(true)
    expect(workspaceContextService.addFile).toHaveBeenCalled()
  })

  it('write_file stages when applyWrites is false', async () => {
    const result = await executeAgentTool(
      {
        name: 'write_file',
        arguments: { path: 'staged.ts', content: 'const z = 3' },
      },
      { applyWrites: false },
    )
    expect(result.ok).toBe(true)
    expect(result.stagedWrite?.path).toBe('staged.ts')
    expect(workspaceContextService.addFile).not.toHaveBeenCalled()
  })

  it('grep_repo finds content in workspace', async () => {
    const result = await executeAgentTool({
      name: 'grep_repo',
      arguments: { pattern: 'export const x' },
    })
    expect(result.ok).toBe(true)
    expect(result.output).toContain('hello.ts:1:')
  })

  it('run_command rejects blocked patterns', async () => {
    const result = await executeAgentTool({
      name: 'run_command',
      arguments: { command: 'rm -rf /' },
    })
    expect(result.ok).toBe(false)
    expect(result.output).toContain('COMMAND_BLOCKED')
  })
})
