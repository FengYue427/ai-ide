/** v1.5 F6 — acceptance.md verification. */

const CHECKBOX_OPEN = /^-\s+\[\s\]\s+(.+)$/gm
const AIDE_ACCEPTANCE_BLOCK = /```aide-acceptance\n([\s\S]*?)```/g

export interface AcceptanceCommandBlock {
  commands: string[]
}

export interface ParsedAcceptance {
  uncheckedItems: string[]
  commandBlocks: AcceptanceCommandBlock[]
}

export interface AcceptanceCommandResult {
  command: string
  status: 'ok' | 'fail' | 'skip'
  detail?: string
}

export interface AcceptanceVerifyResult {
  ok: boolean
  uncheckedItems: string[]
  commandResults: AcceptanceCommandResult[]
  failures: string[]
}

function parseCommandBlock(body: string): string[] {
  const commands: string[] = []
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^-\s+(.+)$/)
    if (match?.[1]) {
      commands.push(match[1].trim())
      continue
    }
    commands.push(trimmed)
  }
  return commands
}

export function parseAcceptanceMarkdown(content: string): ParsedAcceptance {
  const uncheckedItems: string[] = []
  CHECKBOX_OPEN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = CHECKBOX_OPEN.exec(content)) !== null) {
    uncheckedItems.push(match[1].trim())
  }

  const commandBlocks: AcceptanceCommandBlock[] = []
  AIDE_ACCEPTANCE_BLOCK.lastIndex = 0
  while ((match = AIDE_ACCEPTANCE_BLOCK.exec(content)) !== null) {
    const commands = parseCommandBlock(match[1] ?? '')
    if (commands.length > 0) commandBlocks.push({ commands })
  }

  return { uncheckedItems, commandBlocks }
}

export function verifyAcceptance(
  content: string,
  options?: { isDesktop?: boolean; runCommand?: (command: string) => Promise<{ exitCode: number }> },
): AcceptanceVerifyResult {
  const parsed = parseAcceptanceMarkdown(content)
  const failures: string[] = []
  const commandResults: AcceptanceCommandResult[] = []

  for (const item of parsed.uncheckedItems) {
    failures.push(`unchecked: ${item}`)
  }

  const allCommands = parsed.commandBlocks.flatMap((block) => block.commands)
  for (const command of allCommands) {
    if (!options?.isDesktop || !options.runCommand) {
      commandResults.push({
        command,
        status: 'skip',
        detail: 'command skipped in browser',
      })
      continue
    }
  }

  return {
    ok: failures.length === 0 && commandResults.every((row) => row.status !== 'fail'),
    uncheckedItems: parsed.uncheckedItems,
    commandResults,
    failures,
  }
}

export async function verifyAcceptanceAsync(
  content: string,
  options?: { isDesktop?: boolean; runCommand?: (command: string) => Promise<{ exitCode: number }> },
): Promise<AcceptanceVerifyResult> {
  const parsed = parseAcceptanceMarkdown(content)
  const failures: string[] = []
  const commandResults: AcceptanceCommandResult[] = []

  for (const item of parsed.uncheckedItems) {
    failures.push(`unchecked: ${item}`)
  }

  const allCommands = parsed.commandBlocks.flatMap((block) => block.commands)
  for (const command of allCommands) {
    if (!options?.isDesktop || !options.runCommand) {
      commandResults.push({ command, status: 'skip', detail: 'command skipped in browser' })
      continue
    }
    try {
      const result = await options.runCommand(command)
      if (result.exitCode === 0) {
        commandResults.push({ command, status: 'ok' })
      } else {
        commandResults.push({
          command,
          status: 'fail',
          detail: `exit ${result.exitCode}`,
        })
        failures.push(`command failed: ${command}`)
      }
    } catch (error) {
      commandResults.push({
        command,
        status: 'fail',
        detail: error instanceof Error ? error.message : 'command error',
      })
      failures.push(`command failed: ${command}`)
    }
  }

  return {
    ok: failures.length === 0,
    uncheckedItems: parsed.uncheckedItems,
    commandResults,
    failures,
  }
}
