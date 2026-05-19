import { describe, expect, it } from 'vitest'
import { registerTerminalBridge, runTerminalCommand } from './terminalBridge'

describe('terminalBridge', () => {
  it('parses quoted shell-like commands', async () => {
    let received: { command: string; args: string[] } | null = null
    registerTerminalBridge(async (command, args = []) => {
      received = { command, args }
      return 0
    }, () => ['ok'])

    const output = await runTerminalCommand('node -e "console.log(1)"')
    expect(received).toEqual({ command: 'node', args: ['-e', 'console.log(1)'] })
    expect(output).toBe('ok')
    registerTerminalBridge(null)
  })

  it('throws when terminal is not ready', async () => {
    registerTerminalBridge(null)
    await expect(runTerminalCommand('echo hi')).rejects.toThrow(/尚未就绪/)
  })
})
