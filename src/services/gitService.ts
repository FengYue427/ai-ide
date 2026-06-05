import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { isValidBranchName } from '../lib/isValidBranchName'
import {
  mapStatusMatrixRow,
  normalizeGitPath,
  rowHasStagedChange,
  type StatusMatrixRow,
} from '../lib/gitStatusMatrix'
import { GIT_LOG_PAGE_SIZE } from '../lib/gitLogPagination'

export interface GitStatus {
  filepath: string
  staged: boolean
  status: 'unmodified' | 'added' | 'modified' | 'deleted' | 'untracked'
}

export interface GitCommit {
  oid: string
  commit: {
    message: string
    parent?: string[]
    author: {
      name: string
      email: string
      timestamp: number
    }
  }
}

export interface GitFileSyncUpdate {
  path: string
  content: string | null
}

const DEFAULT_AUTHOR = {
  name: 'AI IDE User',
  email: 'user@ai-ide.local',
}

function filePathOnFs(dir: string, filepath: string): string {
  const prefix = dir === '/' ? '' : dir
  return `${prefix}/${filepath}`.replace(/\/+/g, '/')
}

export async function initRepo(fs: any, dir: string = '/'): Promise<void> {
  await git.init({ fs, dir, defaultBranch: 'main' })
}

export async function addFile(fs: any, dir: string, filepath: string): Promise<void> {
  await git.add({ fs, dir, filepath })
}

/** Alias for single-file stage (v1.3.8 G2). */
export const stageFile = addFile

export async function removeFile(fs: any, dir: string, filepath: string): Promise<void> {
  try {
    await git.remove({ fs, dir, filepath })
  } catch {
    // File might not be tracked
  }
}

export async function unstageFile(fs: any, dir: string, filepath: string): Promise<void> {
  await git.resetIndex({ fs, dir, filepath })
}

export async function commit(
  fs: any,
  dir: string,
  message: string,
  author: { name: string; email: string } = DEFAULT_AUTHOR,
): Promise<string> {
  const commitHash = await git.commit({
    fs,
    dir,
    message,
    author: {
      ...author,
      timestamp: Math.floor(Date.now() / 1000),
      timezoneOffset: new Date().getTimezoneOffset(),
    },
  })
  return commitHash
}

export async function getStatus(fs: any, dir: string): Promise<GitStatus[]> {
  const matrix = (await git.statusMatrix({ fs, dir })) as StatusMatrixRow[]
  return matrix
    .map((row) => mapStatusMatrixRow(row))
    .filter((item): item is GitStatus => item !== null)
}

export async function getLog(
  fs: any,
  dir: string,
  options?: { ref?: string; depth?: number },
): Promise<GitCommit[]> {
  const commits = await git.log({
    fs,
    dir,
    ref: options?.ref ?? 'HEAD',
    depth: options?.depth ?? GIT_LOG_PAGE_SIZE,
  })
  return commits as GitCommit[]
}

export async function getCurrentBranch(fs: any, dir: string = '/'): Promise<string | null> {
  try {
    const branch = await git.currentBranch({ fs, dir })
    return branch ?? null
  } catch {
    return null
  }
}

export async function listBranches(fs: any, dir: string = '/'): Promise<string[]> {
  try {
    const branches = await git.listBranches({ fs, dir })
    return branches.length > 0 ? branches : ['main']
  } catch {
    return ['main']
  }
}

export async function checkoutBranch(fs: any, dir: string, branch: string): Promise<void> {
  await git.checkout({ fs, dir, ref: branch })
}

/** Create a branch from HEAD and optionally check it out. */
export async function createBranch(
  fs: any,
  dir: string,
  branchName: string,
  checkout = true,
): Promise<void> {
  const ref = branchName.trim()
  if (!isValidBranchName(ref)) {
    throw new Error('Invalid branch name')
  }

  const existing = await listBranches(fs, dir)
  if (existing.includes(ref)) {
    throw new Error('Branch already exists')
  }

  await git.branch({ fs, dir, ref, checkout })
}

/** Read current worktree contents for editor/workspace sync after checkout or reset. */
export async function readWorktreeContents(
  fs: any,
  dir: string,
  filepaths: string[],
): Promise<GitFileSyncUpdate[]> {
  const seen = new Set<string>()
  const updates: GitFileSyncUpdate[] = []

  for (const filepath of filepaths) {
    const normalized = filepath.replace(/^\.\//, '').trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)

    try {
      const content = await readWorkdirFile(fs, dir, normalized)
      updates.push({ path: normalized, content })
    } catch {
      updates.push({ path: normalized, content: null })
    }
  }

  return updates
}

async function readWorkdirFile(fs: any, dir: string, filepath: string): Promise<string> {
  const path = filePathOnFs(dir, filepath)
  const raw = await fs.readFile(path, 'utf-8')
  return typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
}

async function removeWorkdirFile(fs: any, dir: string, filepath: string): Promise<void> {
  const path = filePathOnFs(dir, filepath)
  if (typeof fs.rm === 'function') {
    await fs.rm(path, { force: true })
    return
  }
  if (typeof fs.unlink === 'function') {
    await fs.unlink(path)
  }
}

/** Discard worktree changes for one file; returns editor content or null if removed. */
export async function discardFileChanges(
  fs: any,
  dir: string,
  filepath: string,
  fileStatus: GitStatus['status'],
): Promise<string | null> {
  if (fileStatus === 'untracked') {
    await removeWorkdirFile(fs, dir, filepath)
    return null
  }

  if (fileStatus === 'added') {
    await git.resetIndex({ fs, dir, filepath })
    await removeWorkdirFile(fs, dir, filepath)
    return null
  }

  await git.checkout({
    fs,
    dir,
    ref: 'HEAD',
    filepaths: [filepath],
    force: true,
  })

  if (fileStatus === 'deleted') {
    return await readWorkdirFile(fs, dir, filepath)
  }

  try {
    return await readWorkdirFile(fs, dir, filepath)
  } catch {
    return ''
  }
}

export async function discardAllUnstaged(
  fs: any,
  dir: string,
  items: GitStatus[],
): Promise<GitFileSyncUpdate[]> {
  const updates: GitFileSyncUpdate[] = []
  for (const item of items.filter((entry) => !entry.staged)) {
    const content = await discardFileChanges(fs, dir, item.filepath, item.status)
    updates.push({ path: item.filepath, content })
  }
  return updates
}

export async function stageAllUnstaged(fs: any, dir: string, items: GitStatus[]): Promise<number> {
  const targets = items.filter((entry) => !entry.staged)
  for (const item of targets) {
    await addFile(fs, dir, item.filepath)
  }
  return targets.length
}

async function readTreeBlobContent(
  fs: any,
  dir: string,
  entry: any,
  decoder: TextDecoder,
): Promise<string> {
  if (!entry) return ''
  try {
    const type = await entry.type()
    if (type !== 'blob') return ''
    const content = await entry.content()
    if (content) return decoder.decode(content)
    const oid = await entry.oid()
    const { blob } = await git.readBlob({ fs, dir, oid })
    return decoder.decode(blob)
  } catch {
    return ''
  }
}

async function walkStagedDiffSide(
  fs: any,
  dir: string,
  filepath: string,
  includeHead: boolean,
): Promise<{ visited: boolean; oldContent: string; newContent: string }> {
  const decoder = new TextDecoder()
  let visited = false
  let oldContent = ''
  let newContent = ''

  const trees = includeHead ? [git.TREE({ ref: 'HEAD' }), git.STAGE()] : [git.STAGE()]

  await git.walk({
    fs,
    dir,
    trees,
    map: async (path, entries) => {
      if (path !== filepath) return null
      visited = true

      const head = includeHead ? entries[0] ?? undefined : undefined
      const stage = (includeHead ? entries[1] : entries[0]) ?? undefined

      oldContent = includeHead ? await readTreeBlobContent(fs, dir, head, decoder) : ''
      newContent = await readTreeBlobContent(fs, dir, stage, decoder)
      return true
    },
  })

  return { visited, oldContent, newContent }
}

export async function getStagedDiff(
  fs: any,
  dir: string,
  filepath: string,
): Promise<{ oldContent: string; newContent: string }> {
  const normalized = normalizeGitPath(filepath)

  const matrix = (await git.statusMatrix({ fs, dir, filepaths: [normalized] })) as StatusMatrixRow[]
  const row = matrix.find(([path]) => path === normalized)
  if (!row || !rowHasStagedChange(row)) {
    throw new Error(`Staged diff unavailable for ${normalized}`)
  }

  let result = { visited: false, oldContent: '', newContent: '' }

  try {
    result = await walkStagedDiffSide(fs, dir, normalized, true)
  } catch {
    result = await walkStagedDiffSide(fs, dir, normalized, false)
  }

  if (!result.visited) {
    result = await walkStagedDiffSide(fs, dir, normalized, false)
  }

  if (!result.visited) {
    throw new Error(`Staged diff unavailable for ${normalized}`)
  }

  return { oldContent: result.oldContent, newContent: result.newContent }
}

export interface GitCommitFileChange {
  filepath: string
  status: 'added' | 'modified' | 'deleted'
}

async function readBlobAtCommit(
  fs: any,
  dir: string,
  commitOid: string,
  filepath: string,
): Promise<string> {
  const decoder = new TextDecoder()
  try {
    const { blob } = await git.readBlob({ fs, dir, oid: commitOid, filepath })
    return decoder.decode(blob)
  } catch {
    return ''
  }
}

/** List files changed in a commit (parent tree vs commit tree). Loads trees on demand. */
export async function getCommitChangedFiles(
  fs: any,
  dir: string,
  commitOid: string,
): Promise<GitCommitFileChange[]> {
  const { commit } = await git.readCommit({ fs, dir, oid: commitOid })
  const parentOid = commit.parent[0]
  const changes: GitCommitFileChange[] = []

  if (!parentOid) {
    await git.walk({
      fs,
      dir,
      trees: [git.TREE({ ref: commitOid })],
      map: async (filepath, [entry]) => {
        if (!entry || filepath === '.') return null
        changes.push({ filepath, status: 'added' })
        return null
      },
    })
    return changes.sort((a, b) => a.filepath.localeCompare(b.filepath))
  }

  await git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: parentOid }), git.TREE({ ref: commitOid })],
    map: async (filepath, [parentEntry, commitEntry]) => {
      if (filepath === '.') return null
      if (!parentEntry && commitEntry) {
        changes.push({ filepath, status: 'added' })
      } else if (parentEntry && !commitEntry) {
        changes.push({ filepath, status: 'deleted' })
      } else if (parentEntry && commitEntry) {
        const parentId = await parentEntry.oid()
        const commitId = await commitEntry.oid()
        if (parentId !== commitId) {
          changes.push({ filepath, status: 'modified' })
        }
      }
      return null
    },
  })

  return changes.sort((a, b) => a.filepath.localeCompare(b.filepath))
}

/** Diff one file at a commit (parent vs commit). Blob reads are lazy per file. */
export async function getCommitFileDiff(
  fs: any,
  dir: string,
  commitOid: string,
  filepath: string,
): Promise<{ oldContent: string; newContent: string }> {
  const { commit } = await git.readCommit({ fs, dir, oid: commitOid })
  const parentOid = commit.parent[0]

  let oldContent = ''
  let newContent = ''

  if (parentOid) {
    oldContent = await readBlobAtCommit(fs, dir, parentOid, filepath)
  }

  newContent = await readBlobAtCommit(fs, dir, commitOid, filepath)

  return { oldContent, newContent }
}

export async function getFileDiff(
  fs: any,
  dir: string,
  filepath: string,
): Promise<{ oldContent: string; newContent: string }> {
  const decoder = new TextDecoder()
  let oldContent = ''
  let newContent = ''

  try {
    const headBlob = await git.readBlob({ fs, dir, oid: 'HEAD', filepath })
    oldContent = decoder.decode(headBlob.blob)
  } catch {
    oldContent = ''
  }

  try {
    newContent = await readWorkdirFile(fs, dir, filepath)
  } catch {
    newContent = ''
  }

  return { oldContent, newContent }
}

export async function pushToGitHub(
  fs: any,
  dir: string,
  remoteUrl: string,
  token: string,
  ref: string = 'main',
): Promise<void> {
  const url = remoteUrl.replace('https://', `https://oauth2:${token}@`)

  await git.push({
    fs,
    http,
    dir,
    url,
    remote: 'origin',
    remoteRef: ref,
    onAuth: () => ({ username: 'oauth2', password: token }),
  })
}

export async function cloneRepo(fs: any, dir: string, url: string, token?: string): Promise<void> {
  const authUrl = token ? url.replace('https://', `https://oauth2:${token}@`) : url

  await git.clone({
    fs,
    http,
    dir,
    url: authUrl,
    singleBranch: true,
    depth: 1,
  })
}
