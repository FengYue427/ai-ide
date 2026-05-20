const SAFE_COMMANDS = new Set([
  'echo',
  'pwd',
  'ls',
  'dir',
  'cat',
  'head',
  'tail',
  'wc',
  'grep',
  'find',
  'node',
  'npm',
  'npx',
  'pnpm',
  'yarn',
  'python',
  'python3',
  'pip',
  'pip3',
  'git',
])

const UNSAFE_SHELL_CHARS = /[;&|`$<>]/

function tokenize(commandLine: string): string[] {
  const trimmed = commandLine.trim()
  if (!trimmed) return []
  const matches = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
  return (matches ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}

export function isTerminalCommandAllowed(commandLine: string, mode: 'full' | 'safe'): boolean {
  if (mode === 'full') return true

  const trimmed = commandLine.trim()
  if (!trimmed) return false
  if (UNSAFE_SHELL_CHARS.test(trimmed)) return false

  const tokens = tokenize(trimmed)
  if (tokens.length === 0) return false

  const [command, subcommand] = tokens
  const base = command.toLowerCase()

  if (!SAFE_COMMANDS.has(base)) return false

  if (base === 'git' && subcommand) {
    const allowedGit = new Set(['status', 'log', 'diff', 'branch', 'show', 'rev-parse'])
    return allowedGit.has(subcommand.toLowerCase())
  }

  return true
}
