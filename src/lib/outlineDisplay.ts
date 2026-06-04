import type { IndexedSymbol } from '../services/projectIndexService'

/** Sidebar outline label — includes parent scope when present. */
export function formatOutlineSymbolLabel(symbol: IndexedSymbol): string {
  return symbol.scope ? `${symbol.scope}.${symbol.name}` : symbol.name
}

export function isScopedOutlineSymbol(symbol: IndexedSymbol): boolean {
  return Boolean(symbol.scope)
}
