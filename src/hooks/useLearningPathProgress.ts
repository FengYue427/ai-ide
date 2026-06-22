import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  getLearningPathProgressMap,
  getLearningPathStatus,
  LEARNING_PATH_PROGRESS_EVENT,
  type LearningPathStatus,
} from '../lib/learningPathProgress'

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(LEARNING_PATH_PROGRESS_EVENT, onStoreChange)
  return () => window.removeEventListener(LEARNING_PATH_PROGRESS_EVENT, onStoreChange)
}

export function useLearningPathProgress(): {
  getStatus: (pathId: string) => LearningPathStatus
  progressMap: ReturnType<typeof getLearningPathProgressMap>
} {
  const progressMap = useSyncExternalStore(subscribe, getLearningPathProgressMap, () => ({}))
  const getStatus = useCallback((pathId: string) => getLearningPathStatus(pathId), [progressMap])
  return useMemo(() => ({ getStatus, progressMap }), [getStatus, progressMap])
}
