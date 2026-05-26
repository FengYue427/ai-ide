/**
 * Node fs project scan for IDE-4b (no 500-file browser cap).
 */
import fs from 'fs/promises'
import path from 'path'

export const DESKTOP_MAX_IMPORT_FILES = 2000
export const DESKTOP_MAX_FILE_BYTES = 1024 * 1024

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  'out',
  '.cache',
])

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'zip', 'gz', 'wasm', 'exe', 'dll', 'pdf', 'mp3', 'mp4',
])

function isTextLike(relPath) {
  const ext = relPath.split('.').pop()?.toLowerCase() ?? ''
  return !BINARY_EXT.has(ext)
}

function parseGitignore(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

function ignored(relPath, rules) {
  for (const rule of rules) {
    if (rule.endsWith('/')) {
      if (relPath.startsWith(rule) || relPath.includes(`/${rule}`)) return true
    } else if (rule.includes('*')) {
      const re = new RegExp(`^${rule.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`)
      if (re.test(relPath.split('/').pop() ?? '')) return true
    } else if (relPath === rule || relPath.endsWith(`/${rule}`)) return true
  }
  return false
}

export function resolveUnderRoot(rootPath, relPath) {
  const root = path.resolve(rootPath)
  const full = path.resolve(root, relPath)
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error('INVALID_PATH')
  }
  return full
}

export async function scanProjectFolder(rootPath) {
  const root = path.resolve(rootPath)
  const rootName = path.basename(root)
  let rules = []

  try {
    const gi = await fs.readFile(path.join(root, '.gitignore'), 'utf8')
    rules = parseGitignore(gi)
  } catch {
    /* no gitignore */
  }

  const collected = []
  const state = { count: 0, capped: false }
  const errors = []

  async function walk(dir, prefix) {
    if (state.capped) return
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
      return
    }

    for (const ent of entries) {
      if (state.capped) break
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name
      if (ent.isDirectory()) {
        if (IGNORE_DIRS.has(ent.name)) continue
        if (ignored(rel + '/', rules)) continue
        await walk(path.join(dir, ent.name), rel)
        continue
      }
      if (!ent.isFile()) continue
      if (!isTextLike(rel)) continue
      if (ignored(rel, rules)) continue
      if (state.count >= DESKTOP_MAX_IMPORT_FILES) {
        state.capped = true
        break
      }
      const full = path.join(dir, ent.name)
      try {
        const st = await fs.stat(full)
        if (st.size > DESKTOP_MAX_FILE_BYTES) continue
        const content = await fs.readFile(full, 'utf8')
        collected.push({ path: rel.replace(/\\/g, '/'), content, size: st.size })
        state.count++
      } catch (e) {
        errors.push(`${rel}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  await walk(root, '')

  return {
    rootPath: root,
    rootName,
    imported: collected.length,
    skipped: errors.length,
    capped: state.capped,
    errors,
    entries: collected,
  }
}

export async function readProjectFile(rootPath, relPath, startLine, endLine) {
  const full = resolveUnderRoot(rootPath, relPath)
  const text = await fs.readFile(full, 'utf8')
  if (startLine === undefined && endLine === undefined) return text
  const lines = text.split(/\r?\n/)
  const start = Math.max(1, startLine ?? 1)
  const end = Math.min(lines.length, endLine ?? lines.length)
  return lines.slice(start - 1, end).join('\n')
}

export async function writeProjectFile(rootPath, relPath, content) {
  const full = resolveUnderRoot(rootPath, relPath)
  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, content, 'utf8')
}
