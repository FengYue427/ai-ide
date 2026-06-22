import { useEffect, useRef } from 'react'
import {
  buildSessionResumeSnapshot,
  persistSessionResume,
} from '../lib/sessionResume'
import { useIDEStore } from '../store/ideStore'

const DEBOUNCE_MS = 1200

/** Persist session snapshot for "continue where you left off". */
export function useSessionResumeSync(enabled: boolean): void {
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const workspaceMode = useIDEStore((s) => s.workspaceMode)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || files.length === 0) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      persistSessionResume(
        buildSessionResumeSnapshot({
          files,
          activeFileIndex: activeFile,
          workspaceMode,
        }),
      )
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeFile, enabled, files, workspaceMode])
}
