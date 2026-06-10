import { useCallback, useState, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react'
import { getActiveMentionQuery, insertMention } from '../lib/mentionQuery'
import { projectIndexManager } from '../services/projectIndexManager'
import type { IndexSearchHit } from '../services/projectIndexService'

export interface UseChatMentionComposerParams {
  input: string
  setInput: (value: string) => void
  inputRef: RefObject<HTMLTextAreaElement>
  indexVersion: number
  mentionBlockedByIndexBuild: boolean
  onSend: () => void
}

export function useChatMentionComposer({
  input,
  setInput,
  inputRef,
  indexVersion,
  mentionBlockedByIndexBuild,
  onSend,
}: UseChatMentionComposerParams) {
  const [mentionHits, setMentionHits] = useState<IndexSearchHit[]>([])
  const [recentMentionHits, setRecentMentionHits] = useState<IndexSearchHit[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [activeMentionQuery, setActiveMentionQuery] = useState<string | null>(null)
  const [mentionOnboardingDismissed, setMentionOnboardingDismissed] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('ai-ide:mention-onboarding-dismissed') === 'true'
    } catch {
      return false
    }
  })

  const refreshMentionHits = useCallback(
    (text: string, cursor: number) => {
      const query = getActiveMentionQuery(text, cursor)
      if (query === null) {
        setActiveMentionQuery(null)
        setMentionHits([])
        return
      }
      setActiveMentionQuery(query)
      if (mentionBlockedByIndexBuild) {
        setMentionHits(recentMentionHits)
        setMentionIndex(0)
        return
      }
      const hits = projectIndexManager.search(query, 8)
      setMentionHits(hits)
      if (hits.length > 0) setRecentMentionHits(hits)
      setMentionIndex(0)
    },
    [indexVersion, mentionBlockedByIndexBuild, recentMentionHits],
  )

  const pickMention = useCallback(
    (hit: IndexSearchHit) => {
      const label =
        hit.type === 'symbol' && hit.path ? `${hit.path}#${hit.name}` : hit.path || hit.name
      const cursor = inputRef.current?.selectionStart ?? input.length
      const next = insertMention(input, cursor, label)
      setInput(next.text)
      setMentionHits([])
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(next.cursor, next.cursor)
      })
    },
    [input, inputRef, setInput],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionHits.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setMentionIndex((prev) => Math.min(prev + 1, mentionHits.length - 1))
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setMentionIndex((prev) => Math.max(prev - 1, 0))
          return
        }
        if (event.key === 'Tab' || (event.key === 'Enter' && mentionHits[mentionIndex])) {
          event.preventDefault()
          pickMention(mentionHits[mentionIndex])
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setMentionHits([])
          return
        }
      }

      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault()
        onSend()
      }
    },
    [mentionHits, mentionIndex, onSend, pickMention],
  )

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value
      setInput(next)
      refreshMentionHits(next, event.target.selectionStart ?? next.length)
    },
    [refreshMentionHits, setInput],
  )

  const dismissMentionOnboarding = useCallback(() => {
    setMentionOnboardingDismissed(true)
    try {
      localStorage.setItem('ai-ide:mention-onboarding-dismissed', 'true')
    } catch {
      // ignore
    }
  }, [])

  return {
    mentionHits,
    mentionIndex,
    activeMentionQuery,
    mentionOnboardingDismissed,
    dismissMentionOnboarding,
    pickMention,
    handleKeyDown,
    handleInputChange,
  }
}
