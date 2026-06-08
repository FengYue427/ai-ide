import { describe, expect, it, vi, beforeEach } from 'vitest'

const sendChatCompletion = vi.fn()
const executeAgentTool = vi.fn()

vi.mock('./agentChatCompletion', () => ({
  sendChatCompletion: (...args: unknown[]) => sendChatCompletion(...args),
}))

vi.mock('./agentTools/executor', () => ({
  executeAgentTool: (...args: unknown[]) => executeAgentTool(...args),
}))

vi.mock('./agentSettingsService', () => ({
  loadAgentSettings: vi.fn(async () => ({
    useToolLoop: true,
    autoApplyWrites: false,
    maxRounds: 4,
  })),
}))

vi.mock('./workspaceContextService', () => ({
  workspaceContextService: {
    getFile: vi.fn(() => undefined),
  },
}))

import { runAgentLoop } from './agentRunner'

describe('runAgentLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stops when model returns text without tool calls', async () => {
    sendChatCompletion.mockResolvedValueOnce({
      content: 'Done.',
      tool_calls: undefined,
      finish_reason: 'stop',
    })

    const result = await runAgentLoop(
      { provider: 'deepseek', apiKey: 'k', model: 'deepseek-chat' },
      [{ role: 'user', content: 'hi' }],
    )

    expect(result.finalContent).toBe('Done.')
    expect(result.rounds).toBe(1)
    expect(sendChatCompletion).toHaveBeenCalledTimes(1)
  })

  it('runs tools then finishes', async () => {
    sendChatCompletion
      .mockResolvedValueOnce({
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'read_file', arguments: '{"path":"a.ts"}' },
          },
        ],
        finish_reason: 'tool_calls',
      })
      .mockResolvedValueOnce({
        content: 'Updated a.ts',
        finish_reason: 'stop',
      })

    executeAgentTool.mockResolvedValueOnce({
      ok: true,
      output: 'file content',
    })

    const result = await runAgentLoop(
      { provider: 'deepseek', apiKey: 'k', model: 'deepseek-chat' },
      [{ role: 'user', content: 'fix a.ts' }],
    )

    expect(result.activity).toHaveLength(1)
    expect(result.activity[0].tool).toBe('read_file')
    expect(result.finalContent).toBe('Updated a.ts')
    expect(executeAgentTool).toHaveBeenCalledWith(
      { name: 'read_file', arguments: { path: 'a.ts' } },
      { applyWrites: true },
    )
  })

  it('collects staged writes when autoApply is off', async () => {
    sendChatCompletion
      .mockResolvedValueOnce({
        content: null,
        tool_calls: [
          {
            id: 'call_w',
            type: 'function',
            function: {
              name: 'write_file',
              arguments: '{"path":"b.ts","content":"const b=1"}',
            },
          },
        ],
      })
      .mockResolvedValueOnce({ content: 'Wrote b.ts' })

    executeAgentTool.mockResolvedValueOnce({
      ok: true,
      output: 'STAGED',
      stagedWrite: { path: 'b.ts', content: 'const b=1' },
    })

    const result = await runAgentLoop(
      { provider: 'deepseek', apiKey: 'k', model: 'deepseek-chat' },
      [{ role: 'user', content: 'add b.ts' }],
    )

    expect(result.pendingChanges).toHaveLength(1)
    expect(result.pendingChanges[0].path).toBe('b.ts')
    expect(result.activity.some((a) => a.tool === 'write_file' && a.hunkCount != null)).toBe(true)
    expect(executeAgentTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'write_file' }),
      { applyWrites: false },
    )
  })

  it('requests a text summary when tools run without assistant text', async () => {
    sendChatCompletion
      .mockResolvedValueOnce({
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'list_files', arguments: '{}' },
          },
        ],
        finish_reason: 'tool_calls',
      })
      .mockResolvedValueOnce({
        content: null,
        tool_calls: undefined,
        finish_reason: 'stop',
      })
      .mockResolvedValueOnce({
        content: '工作区包含 src 与 docs 等目录。',
        finish_reason: 'stop',
      })

    executeAgentTool.mockResolvedValueOnce({
      ok: true,
      output: 'src/a.ts\ndocs/readme.md',
    })

    const result = await runAgentLoop(
      { provider: 'deepseek', apiKey: 'k', model: 'deepseek-chat' },
      [{ role: 'user', content: '查看工作区' }],
    )

    expect(result.finalContent).toContain('工作区')
    expect(sendChatCompletion).toHaveBeenCalledTimes(3)
    expect(sendChatCompletion.mock.calls[2][2]).toEqual({ signal: undefined, tools: [] })
  })

  it('stops repeating the same tool and asks for summary', async () => {
    sendChatCompletion
      .mockResolvedValueOnce({
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'list_files', arguments: '{}' },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: null,
        tool_calls: [
          {
            id: 'call_2',
            type: 'function',
            function: { name: 'list_files', arguments: '{}' },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: '已列出主要文件。',
        finish_reason: 'stop',
      })

    executeAgentTool.mockResolvedValue({ ok: true, output: 'a.ts' })

    const result = await runAgentLoop(
      { provider: 'deepseek', apiKey: 'k', model: 'deepseek-chat' },
      [{ role: 'user', content: '查看工作区' }],
    )

    expect(result.activity).toHaveLength(2)
    expect(result.finalContent).toBe('已列出主要文件。')
    expect(sendChatCompletion).toHaveBeenCalledTimes(3)
  })
})
