import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

export interface GitStatus {
  filepath: string
  staged: boolean
  status: 'unmodified' | 'added' | 'modified' | 'deleted' | 'untracked'
}

export interface GitCommit {
  oid: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      timestamp: number
    }
  }
}

const DEFAULT_AUTHOR = {
  name: 'AI IDE User',
  email: 'user@ai-ide.local'
}

export async function initRepo(fs: any, dir: string = '/'): Promise<void> {
  await git.init({ fs, dir, defaultBranch: 'main' })
}

export async function addFile(fs: any, dir: string, filepath: string): Promise<void> {
  await git.add({ fs, dir, filepath })
}

export async function removeFile(fs: any, dir: string, filepath: string): Promise<void> {
  try {
    await git.remove({ fs, dir, filepath })
  } catch {
    // File might not be tracked
  }
}

export async function commit(
  fs: any,
  dir: string,
  message: string,
  author: { name: string; email: string } = DEFAULT_AUTHOR
): Promise<string> {
  const commitHash = await git.commit({
    fs,
    dir,
    message,
    author: {
      ...author,
      timestamp: Math.floor(Date.now() / 1000),
      timezoneOffset: new Date().getTimezoneOffset()
    }
  })
  return commitHash
}

export async function getStatus(fs: any, dir: string): Promise<GitStatus[]> {
  const matrix = await git.statusMatrix({ fs, dir })
  // matrix: [filepath, HEAD, WORKDIR, STAGE]
  return matrix.map(([filepath, head, workdir, stage]) => {
    let status: GitStatus['status']
    if (head === 0 && workdir === 1 && stage === 1) status = 'added'
    else if (head === 1 && workdir === 1 && stage === 1) status = 'unmodified'
    else if (head === 1 && workdir === 2 && stage === 1) status = 'modified'
    else if (head === 1 && workdir === 0 && stage === 1) status = 'deleted'
    else if (head === 0 && workdir === 1 && stage === 0) status = 'untracked'
    else status = 'modified'

    return {
      filepath: filepath as string,
      staged: stage !== 0 && stage !== head,
      status
    }
  }).filter(s => s.status !== 'unmodified')
}

export async function getLog(fs: any, dir: string): Promise<GitCommit[]> {
  const commits = await git.log({ fs, dir, depth: 50 })
  return commits as GitCommit[]
}

export async function pushToGitHub(
  fs: any,
  dir: string,
  remoteUrl: string,
  token: string,
  ref: string = 'main'
): Promise<void> {
  // Remove https:// or git@ and reconstruct with token
  const url = remoteUrl.replace('https://', `https://oauth2:${token}@`)
  
  await git.push({
    fs,
    http,
    dir,
    url,
    remote: 'origin',
    remoteRef: ref,
    onAuth: () => ({ username: 'oauth2', password: token })
  })
}

export async function cloneRepo(
  fs: any,
  dir: string,
  url: string,
  token?: string
): Promise<void> {
  const authUrl = token ? url.replace('https://', `https://oauth2:${token}@`) : url
  
  await git.clone({
    fs,
    http,
    dir,
    url: authUrl,
    singleBranch: true,
    depth: 1
  })
}
