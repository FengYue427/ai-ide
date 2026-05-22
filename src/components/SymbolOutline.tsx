import { ChevronRight, ListTree } from 'lucide-react'
import { useMemo } from 'react'
import { extractSymbolsFromContent, type IndexedSymbol, type SymbolKind } from '../services/projectIndexService'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'

const KIND_LABEL: Record<SymbolKind, string> = {
  function: 'fn',
  class: 'class',
  interface: 'iface',
  type: 'type',
  const: 'const',
  enum: 'enum',
  method: 'method',
  unknown: 'sym',
}

interface SymbolOutlineProps {
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function SymbolOutline({ collapsed, onToggleCollapsed }: SymbolOutlineProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)

  const current = files[activeFile]
  const symbols = useMemo(() => {
    if (!current?.content) return []
    return extractSymbolsFromContent(current.name, current.content)
  }, [current?.name, current?.content])

  if (!current) return null

  return (
    <div className="sidebar-outline">
      <button
        type="button"
        className="sidebar-outline-header"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
      >
        <ListTree size={14} />
        <span>{t('outline.title')}</span>
        <span className="sidebar-outline-count">{symbols.length}</span>
        <ChevronRight size={14} className={collapsed ? '' : 'sidebar-outline-chevron-open'} />
      </button>

      {!collapsed && (
        <div className="sidebar-outline-list">
          {symbols.length === 0 ? (
            <div className="sidebar-outline-empty">{t('outline.empty')}</div>
          ) : (
            symbols.map((symbol) => (
              <OutlineRow
                key={`${symbol.name}-${symbol.line}-${symbol.kind}`}
                symbol={symbol}
                onGo={() =>
                  setEditorTarget({ line: symbol.line, column: 1, nonce: Date.now() })
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function OutlineRow({ symbol, onGo }: { symbol: IndexedSymbol; onGo: () => void }) {
  return (
    <button type="button" className="sidebar-outline-item" onClick={onGo} title={`${symbol.path}:${symbol.line}`}>
      <span className={`sidebar-outline-kind sidebar-outline-kind--${symbol.kind}`}>
        {KIND_LABEL[symbol.kind]}
      </span>
      <span className="sidebar-outline-name">{symbol.name}</span>
      <span className="sidebar-outline-line">:{symbol.line}</span>
    </button>
  )
}
