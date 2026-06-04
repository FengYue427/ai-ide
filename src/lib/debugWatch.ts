export const MAX_DEBUG_WATCH_EXPRESSIONS = 3

const STORAGE_KEY = 'ai-ide:debug-watch'

export function normalizeWatchSlots(expressions: string[]): string[] {
  const slots = expressions.slice(0, MAX_DEBUG_WATCH_EXPRESSIONS).map((e) => e.trim())
  while (slots.length < MAX_DEBUG_WATCH_EXPRESSIONS) slots.push('')
  return slots
}

export function loadDebugWatchExpressions(): string[] {
  if (typeof localStorage === 'undefined') {
    return normalizeWatchSlots([])
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return normalizeWatchSlots([])
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return normalizeWatchSlots([])
    return normalizeWatchSlots(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return normalizeWatchSlots([])
  }
}

export function saveDebugWatchExpressions(expressions: string[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeWatchSlots(expressions)))
}

export function setDebugWatchSlot(slots: string[], index: number, expression: string): string[] {
  const next = normalizeWatchSlots(slots)
  if (index < 0 || index >= MAX_DEBUG_WATCH_EXPRESSIONS) return next
  next[index] = expression.trim()
  return next
}

export function nonEmptyWatchExpressions(slots: string[]): string[] {
  return slots.map((e) => e.trim()).filter(Boolean)
}
