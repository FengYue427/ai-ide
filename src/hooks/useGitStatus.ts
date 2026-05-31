import { useEffect, useRef, useState } from 'react'
import { gitStatusRefreshDelayMs } from '../lib/gitStatusRefreshPrefs'
import { loadGitReadonlySnapshot } from '../lib/gitReadonlySnapshot'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

async function syncGitStatusCounts(
  fs: any,
  files: FileItem[],
): Promise<{ branch: string | undefined; modifiedCount: number; unstagedCount: number }> {
  const syncWorkspaceToFs = async () => {
    for (const file of files) {
      await fs.writeFile(file.name, file.content)
    }
  }

  const snapshot = await loadGitReadonlySnapshot(fs, syncWorkspaceToFs)
  if (!snapshot) {
    throw new Error('Git runtime not ready')
  }

  return {
    branch: snapshot.branch ?? undefined,
    modifiedCount: snapshot.status.length,
    unstagedCount: snapshot.status.filter((item) => !item.staged).length,
  }
}

export function useGitStatus(fs: any, files: FileItem[]) {
  const gitManualRefreshOnly = useIDEStore((s) => s.gitManualRefreshOnly)
  const gitStatusRefreshNonce = useIDEStore((s) => s.gitStatusRefreshNonce)
  const [branch, setBranch] = useState<string | undefined>()
  const [modifiedCount, setModifiedCount] = useState(0)
  const [unstagedCount, setUnstagedCount] = useState(0)
  const prevFsRef = useRef<typeof fs>(null)
  const prevNonceRef = useRef(gitStatusRefreshNonce)

  useEffect(() => {
    if (!fs) {
      setBranch(undefined)
      setModifiedCount(0)
      setUnstagedCount(0)
      prevFsRef.current = null
      return
    }

    const fsJustReady = prevFsRef.current !== fs
    prevFsRef.current = fs
    const manualTrigger = gitStatusRefreshNonce > prevNonceRef.current
    prevNonceRef.current = gitStatusRefreshNonce

    if (gitManualRefreshOnly && !fsJustReady && !manualTrigger) {
      return
    }

    let cancelled = false
    const delay = manualTrigger || fsJustReady ? 0 : gitStatusRefreshDelayMs('auto')
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const next = await syncGitStatusCounts(fs, files)
          if (cancelled) return
          setBranch(next.branch)
          setModifiedCount(next.modifiedCount)
          setUnstagedCount(next.unstagedCount)
        } catch {
          if (!cancelled) {
            setBranch(undefined)
            setModifiedCount(0)
            setUnstagedCount(0)
          }
        }
      })()
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fs, files, gitManualRefreshOnly, gitStatusRefreshNonce])

  return { branch, modifiedCount, unstagedCount }
}
