import { useEffect, useState } from 'react'
import { getCurrentBranch, getStatus } from '../services/gitService'
import type { FileItem } from '../types/file'

const DEBOUNCE_MS = 500

export function useGitStatus(fs: any, files: FileItem[]) {
  const [branch, setBranch] = useState<string | undefined>()
  const [modifiedCount, setModifiedCount] = useState(0)
  const [unstagedCount, setUnstagedCount] = useState(0)

  useEffect(() => {
    if (!fs) {
      setBranch(undefined)
      setModifiedCount(0)
      setUnstagedCount(0)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        try {
          for (const file of files) {
            await fs.writeFile(file.name, file.content)
          }
          const [status, currentBranch] = await Promise.all([
            getStatus(fs, '/'),
            getCurrentBranch(fs, '/'),
          ])
          if (cancelled) return
          setBranch(currentBranch ?? undefined)
          setModifiedCount(status.length)
          setUnstagedCount(status.filter((item) => !item.staged).length)
        } catch {
          if (!cancelled) {
            setBranch(undefined)
            setModifiedCount(0)
            setUnstagedCount(0)
          }
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fs, files])

  return { branch, modifiedCount, unstagedCount }
}
