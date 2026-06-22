import { useEffect } from 'react'
import type { FileItem } from '../types/file'
import { syncLearningPathCompletion } from '../lib/learningPathProgress'

/** Marks learning paths complete when their Spec tasks are all checked. */
export function useLearningPathProgressSync(files: FileItem[], enabled = true): void {
  useEffect(() => {
    if (!enabled || files.length === 0) return
    syncLearningPathCompletion(files)
  }, [enabled, files])
}
