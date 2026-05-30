import { useMemo, useState, type FC } from 'react'
import { FileCode2, Play, Search } from 'lucide-react'
import { useI18n } from '../i18n'
import { usePackageScripts } from '../hooks/usePackageScripts'
import { InlineStatePanel } from './InlineStatePanel'

interface NpmScriptsPanelProps {
  isReady: boolean
  isRunning: boolean
  readOnly?: boolean
  onRunScript: (scriptName: string) => void | Promise<void>
  onOpenPackageJson?: () => void
}

export const NpmScriptsPanel: FC<NpmScriptsPanelProps> = ({
  isReady,
  isRunning,
  readOnly = false,
  onRunScript,
  onOpenPackageJson,
}) => {
  const { t } = useI18n()
  const scripts = usePackageScripts()
  const [query, setQuery] = useState('')
  const [lastRun, setLastRun] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter(
      (script) =>
        script.name.toLowerCase().includes(q) || script.command.toLowerCase().includes(q),
    )
  }, [query, scripts])

  const handleRun = (scriptName: string) => {
    if (readOnly || !isReady) return
    setLastRun(scriptName)
    void Promise.resolve(onRunScript(scriptName)).finally(() => {
      setLastRun((prev) => (prev === scriptName ? null : prev))
    })
  }

  if (scripts.length === 0) {
    return (
      <div className="npm-scripts-panel">
        <InlineStatePanel
          compact
          tone="hint"
          icon={FileCode2}
          title={t('scripts.emptyTitle')}
          description={t('scripts.emptyDesc')}
          primaryAction={
            onOpenPackageJson
              ? { label: t('scripts.openPackageJson'), onClick: onOpenPackageJson, variant: 'primary' }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="npm-scripts-panel">
      <div className="npm-scripts-toolbar">
        <div className="npm-scripts-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('scripts.searchPlaceholder')}
            aria-label={t('scripts.searchPlaceholder')}
          />
        </div>
        <span className="npm-scripts-count">{t('scripts.count', { count: filtered.length })}</span>
      </div>

      <ul className="npm-scripts-list">
        {filtered.map((script) => {
          const busy = isRunning || lastRun === script.name
          return (
            <li key={script.name} className="npm-scripts-item">
              <div className="npm-scripts-item-main">
                <span className="npm-scripts-name">{script.name}</span>
                <code className="npm-scripts-command">{script.command}</code>
              </div>
              <button
                type="button"
                className="npm-scripts-run"
                disabled={readOnly || !isReady || busy}
                title={t('scripts.runTitle', { name: script.name })}
                onClick={() => handleRun(script.name)}
              >
                <Play size={12} />
                {busy ? t('scripts.running') : t('scripts.run')}
              </button>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="npm-scripts-no-match">{t('scripts.noMatch')}</p>
      ) : null}
    </div>
  )
}
