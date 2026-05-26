/** Block obviously destructive shell patterns (v1.0.2.5 audit). */
const BLOCKED_PATTERNS: RegExp[] = [
  /\brm\s+(-\w*f\w*\s+)+\//i,
  /\brm\s+-rf\b/i,
  /\bdel\s+\/f/i,
  /\bformat\s+[a-z]:/i,
  /\bmkfs\./i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bpoweroff\b/i,
  /\b:\(\)\s*\{\s*:/,
  />\s*\/dev\/sd[a-z]/i,
]

export function isRunCommandBlocked(commandLine: string): string | null {
  const line = commandLine.trim()
  if (!line) return 'EMPTY_COMMAND'
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(line)) return 'COMMAND_BLOCKED'
  }
  return null
}
