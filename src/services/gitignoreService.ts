/**
 * Minimal .gitignore parser for browser workspace indexing (not full git semantics).
 */

export interface GitignoreRule {
  pattern: string
  negated: boolean
  /** Pattern ended with `/` — treat as directory prefix. */
  directoryOnly: boolean
  /** Pattern started with `/` — match from repo root only. */
  anchored: boolean
}

export function parseGitignore(content: string): GitignoreRule[] {
  const rules: GitignoreRule[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    let negated = false
    let body = line
    if (body.startsWith('!')) {
      negated = true
      body = body.slice(1).trim()
    }
    if (!body) continue

    const directoryOnly = body.endsWith('/')
    if (directoryOnly) body = body.slice(0, -1)

    const anchored = body.startsWith('/')
    if (anchored) body = body.slice(1)

    rules.push({
      pattern: body,
      negated,
      directoryOnly,
      anchored,
    })
  }

  return rules
}

function globToRegExp(pattern: string): RegExp {
  let regex = '^'
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    const next = pattern[i + 1]
    if (char === '*' && next === '*') {
      regex += '.*'
      i++
      continue
    }
    if (char === '*') {
      regex += '[^/]*'
      continue
    }
    if (char === '?') {
      regex += '[^/]'
      continue
    }
    regex += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  regex += '$'
  return new RegExp(regex)
}

function ruleMatchesPath(path: string, rule: GitignoreRule): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  const basename = normalized.split('/').pop() ?? normalized
  const segments = normalized.split('/').filter(Boolean)

  if (rule.directoryOnly) {
    if (rule.anchored) {
      return normalized === rule.pattern || normalized.startsWith(`${rule.pattern}/`)
    }
    if (segments.includes(rule.pattern)) return true
    return normalized.startsWith(`${rule.pattern}/`) || normalized.includes(`/${rule.pattern}/`)
  }

  const candidates = rule.anchored ? [normalized] : [normalized, basename]
  const re = globToRegExp(rule.pattern)

  for (const candidate of candidates) {
    if (re.test(candidate)) return true
    if (!rule.anchored && normalized.includes(`/${rule.pattern}`)) return true
  }

  return false
}

/** Last matching rule wins (supports leading `!`). */
export function isPathIgnoredByGitignore(path: string, rules: GitignoreRule[]): boolean {
  if (rules.length === 0) return false

  let ignored = false
  for (const rule of rules) {
    if (!ruleMatchesPath(path, rule)) continue
    ignored = !rule.negated
  }
  return ignored
}

export function findGitignoreContent(
  sources: { path: string; content: string }[],
): string | null {
  const match = sources.find(
    (source) =>
      source.path === '.gitignore' ||
      source.path.endsWith('/.gitignore') ||
      source.path === '/.gitignore',
  )
  return match?.content ?? null
}
