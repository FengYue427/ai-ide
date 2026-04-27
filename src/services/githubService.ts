import { Octokit } from '@octokit/rest'

export interface GitHubRepo {
  owner: string
  repo: string
  branch?: string
}

export interface GitHubFile {
  path: string
  content: string
  sha?: string
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string = '',
  branch: string = 'main',
  token?: string
): Promise<{ files: GitHubFile[]; error?: string }> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit()
  const files: GitHubFile[] = []

  try {
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    })

    const items = Array.isArray(contents) ? contents : [contents]

    for (const item of items) {
      if (item.type === 'file' && !item.download_url?.includes('node_modules')) {
        // Skip binary and large files
        if (item.size > 500000) continue

        try {
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: item.path,
            ref: branch
          })

          if ('content' in fileData && typeof fileData.content === 'string') {
            const content = atob(fileData.content.replace(/\n/g, ''))
            files.push({
              path: item.path,
              content,
              sha: fileData.sha
            })
          }
        } catch {
          // Skip files that can't be decoded
        }
      } else if (item.type === 'dir' && !['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
        const subFiles = await fetchRepoContents(owner, repo, item.path, branch, token)
        files.push(...subFiles.files)
      }
    }

    return { files }
  } catch (error: any) {
    return { 
      files: [], 
      error: error.status === 404 ? '仓库不存在或私有' : error.message 
    }
  }
}

export async function getRepoBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<string[]> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit()
  
  try {
    const { data: branches } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100
    })
    return branches.map(b => b.name)
  } catch {
    return ['main', 'master']
  }
}

export function parseGitHubUrl(url: string): GitHubRepo | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
        branch: match[3]
      }
    }
  }

  return null
}

export async function createGitHubGist(
  files: { name: string; content: string }[],
  description: string,
  token: string,
  isPublic: boolean = false
): Promise<{ url?: string; error?: string }> {
  const octokit = new Octokit({ auth: token })

  try {
    const { data: gist } = await octokit.gists.create({
      description,
      public: isPublic,
      files: files.reduce((acc, file) => {
        acc[file.name] = { content: file.content }
        return acc
      }, {} as Record<string, { content: string }>)
    })

    return { url: gist.html_url }
  } catch (error: any) {
    return { error: error.message }
  }
}
