/**
 * Read-only git snapshot via native CLI (Electron, v1.1.6.8 spike).
 */
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

function runGit(rootPath, args) {
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd: rootPath,
      env: process.env,
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      })
    })

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
      })
    })
  })
}

async function isGitRepo(rootPath) {
  try {
    await fs.access(path.join(rootPath, '.git'))
    return true
  } catch {
    return false
  }
}

/** @returns {{ ok: true, statusPorcelain: string, branch: string, branches: string[] } | { ok: false, reason: string, detail?: string }} */
export async function readGitReadonlySnapshot(rootPath) {
  const root = path.resolve(String(rootPath ?? ''))
  if (!root) {
    return { ok: false, reason: 'NO_ROOT' }
  }

  if (!(await isGitRepo(root))) {
    return { ok: false, reason: 'NOT_A_GIT_REPO' }
  }

  const [statusResult, branchResult, branchesResult] = await Promise.all([
    runGit(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
    runGit(root, ['branch', '--show-current']),
    runGit(root, ['branch', '--format=%(refname:short)']),
  ])

  if (statusResult.exitCode !== 0) {
    return {
      ok: false,
      reason: 'GIT_STATUS_FAILED',
      detail: statusResult.stderr.trim() || statusResult.stdout.trim(),
    }
  }

  const branch = branchResult.exitCode === 0 ? branchResult.stdout.trim() : ''
  const branches =
    branchesResult.exitCode === 0
      ? branchesResult.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : branch
        ? [branch]
        : ['main']

  return {
    ok: true,
    statusPorcelain: statusResult.stdout,
    branch: branch || branches[0] || 'main',
    branches: branches.length > 0 ? branches : ['main'],
  }
}

/** @returns {{ ok: true, url: string } | { ok: false, reason: string, detail?: string }} */
export async function readGitOriginRemote(rootPath) {
  const root = path.resolve(String(rootPath ?? ''))
  if (!root) return { ok: false, reason: 'NO_ROOT' }
  if (!(await isGitRepo(root))) return { ok: false, reason: 'NOT_A_GIT_REPO' }

  const result = await runGit(root, ['remote', 'get-url', 'origin'])
  if (result.exitCode !== 0) {
    return {
      ok: false,
      reason: 'NO_ORIGIN',
      detail: result.stderr.trim() || result.stdout.trim(),
    }
  }

  const url = result.stdout.trim()
  return url ? { ok: true, url } : { ok: false, reason: 'NO_ORIGIN' }
}

/** @returns {{ ok: true } | { ok: false, reason: string, detail?: string }} */
export async function syncGitOrigin(rootPath, action) {
  const root = path.resolve(String(rootPath ?? ''))
  if (!root) return { ok: false, reason: 'NO_ROOT' }
  if (!(await isGitRepo(root))) return { ok: false, reason: 'NOT_A_GIT_REPO' }

  const args = action === 'pull' ? ['pull', '--ff-only', 'origin'] : ['push', 'origin', 'HEAD']
  const result = await runGit(root, args)
  if (result.exitCode !== 0) {
    return {
      ok: false,
      reason: action === 'pull' ? 'PULL_FAILED' : 'PUSH_FAILED',
      detail: result.stderr.trim() || result.stdout.trim(),
    }
  }

  return { ok: true }
}
