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
  'pnpm',
  'yarn',
  'python',
  'python3',
  'pip',
  'pip3',
  'git',
])

const UNSAFE_SHELL_CHARS = /[;&|`$<>]/

const NPM_SAFE_SUBCOMMANDS = new Set([
  'test',
  'run',
  'install',
  'ci',
  'list',
  'outdated',
  'why',
  'view',
  'version',
])

function tokenize(commandLine: string): string[] {
  const trimmed = commandLine.trim()
  if (!trimmed) return []
  const matches = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
  return (matches ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}

function isNodeEvalInvocation(tokens: string[]): boolean {
  if (tokens[0]?.toLowerCase() !== 'node') return false
  const flags = tokens.slice(1)
  return flags.some((t) => t === '-e' || t === '--eval' || t.startsWith('-e'))
}

function isNpmAllowed(tokens: string[]): boolean {
  if (tokens[0]?.toLowerCase() !== 'npm') return true
  const sub = tokens[1]?.toLowerCase()
  if (!sub) return false
  return NPM_SAFE_SUBCOMMANDS.has(sub)
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

  if (base === 'npx') return false
  if (isNodeEvalInvocation(tokens)) return false
  if (!isNpmAllowed(tokens)) return false

  if (!SAFE_COMMANDS.has(base)) return false

  if (base === 'git' && subcommand) {
    const allowedGit = new Set(['status', 'log', 'diff', 'branch', 'show', 'rev-parse'])
    return allowedGit.has(subcommand.toLowerCase())
  }

  return true
}
