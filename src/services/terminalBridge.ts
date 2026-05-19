export type TerminalRunner = (command: string, args?: string[]) => Promise<number | undefined>

let runner: TerminalRunner | null = null
let getOutputLines: () => string[] = () => []

export function registerTerminalBridge(
  nextRunner: TerminalRunner | null,
  outputReader?: () => string[],
) {
  runner = nextRunner
  getOutputLines = outputReader ?? (() => [])
}

export function isTerminalBridgeReady(): boolean {
  return runner !== null
}

function tokenizeCommand(commandLine: string): string[] {
  const trimmed = commandLine.trim()
  if (!trimmed) return []
  const matches = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
  return (matches ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}

export async function runTerminalCommand(commandLine: string): Promise<string> {
  if (!runner) {
    throw new Error('终端尚未就绪')
  }

  const tokens = tokenizeCommand(commandLine)
  if (tokens.length === 0) return ''

  const [command, ...args] = tokens
  const exitCode = await runner(command, args)
  const output = getOutputLines().join('\n').trim()

  if (exitCode !== undefined && exitCode !== 0) {
    return output ? `${output}\n(exit ${exitCode})` : `(exit ${exitCode})`
  }

  return output
}
