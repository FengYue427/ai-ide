import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useIDEStore, type ReferencesPeekState } from '../store/ideStore'
import { resolveReferenceNavigation } from '../editor/registerCrossFileReferences'

interface ReferencesPeekBarProps {
  peek: ReferencesPeekState
  files: Array<{ name: string; content: string }>
}

export function ReferencesPeekBar({ peek, files }: ReferencesPeekBarProps) {
  const { t } = useI18n()
  const setReferencesPeek = useIDEStore((s) => s.setReferencesPeek)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const setEditorTarget = useIDEStore((s) => s.setEditorTarget)

  const openLocation = (path: string, line: number, column: number) => {
    const nav = resolveReferenceNavigation(files, path, line, column)
    if (!nav) return
    setActiveFile(nav.fileIndex)
    setEditorTarget({ line: nav.line, column: nav.column, nonce: Date.now() })
  }

  return (
    <div className="references-peek-bar" data-testid="references-peek" role="region">
      <div className="references-peek-bar__head">
        <strong>{t('editor.references.peekTitle', { symbol: peek.symbol, count: peek.locations.length })}</strong>
        <button
          type="button"
          className="references-peek-bar__close"
          aria-label={t('editor.references.peekClose')}
          onClick={() => setReferencesPeek(null)}
        >
          <X size={14} />
        </button>
      </div>
      <ul className="references-peek-bar__list">
        {peek.locations.map((loc) => (
          <li key={`${loc.path}:${loc.line}:${loc.column}`}>
            <button
              type="button"
              className="references-peek-bar__item"
              onClick={() => openLocation(loc.path, loc.line, loc.column)}
            >
              <span className="references-peek-bar__path">{loc.path}</span>
              <span className="references-peek-bar__pos">
                {t('editor.references.lineCol', { line: loc.line, column: loc.column })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
