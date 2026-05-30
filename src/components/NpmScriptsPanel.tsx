import { useMemo, useState, type FC } from 'react'
import { AlertCircle, CheckCircle2, FileCode2, Play, Search } from 'lucide-react'
import { useI18n } from '../i18n'
import { useNpmScriptsLastRun } from '../hooks/useNpmScriptsLastRun'
import { usePackageScripts } from '../hooks/usePackageScripts'
import type { NpmScriptRunResult, RunNpmScriptHandler } from '../lib/npmScriptRun'
import { InlineStatePanel } from './InlineStatePanel'

interface NpmScriptsPanelProps {
  isReady: boolean
  isRunning: boolean
  readOnly?: boolean
  onRunScript: RunNpmScriptHandler
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
  const { lastRun, markRunning, markFinished } = useNpmScriptsLastRun()
  const [query, setQuery] = useState('')
  const [activeRun, setActiveRun] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter(
      (script) =>
        script.name.toLowerCase().includes(q) || script.command.toLowerCase().includes(q),
    )
  }, [query, scripts])

  const handleRun = (scriptName: string) => {
    if (readOnly || !isReady || activeRun) return
    setActiveRun(scriptName)
    void markRunning(scriptName)
    void Promise.resolve(onRunScript(scriptName))
      .then((result) => {
        if (!result || typeof result !== 'object' || !('status' in result)) return
        const run = result as NpmScriptRunResult
        if (run.status === 'skipped') return
        void markFinished(
          scriptName,
          run.status === 'success' ? 'success' : 'error',
          run.exitCode,
        )
      })
      .finally(() => {
        setActiveRun((prev) => (prev === scriptName ? null : prev))
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

      {lastRun && lastRun.status !== 'running' ? (
        <p
          className={`npm-scripts-last-run npm-scripts-last-run--${lastRun.status}`}
          role="status"
        >
          {lastRun.status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {lastRun.status === 'success'
            ? t('scripts.lastRunSuccess', { name: lastRun.name })
            : t('scripts.lastRunError', { name: lastRun.name })}
        </p>
      ) : null}

      <ul className="npm-scripts-list">
        {filtered.map((script) => {
          const running = activeRun === script.name || (isRunning && lastRun?.name === script.name && lastRun.status === 'running')
          const isLastRun = lastRun?.name === script.name && lastRun.status !== 'running'
          const itemClass = [
            'npm-scripts-item',
            running ? 'npm-scripts-item--running' : '',
            isLastRun && lastRun?.status === 'success' ? 'npm-scripts-item--last-success' : '',
            isLastRun && lastRun?.status === 'error' ? 'npm-scripts-item--last-error' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={script.name} className={itemClass}>
              <div className="npm-scripts-item-main">
                <span className="npm-scripts-name">{script.name}</span>
                <code className="npm-scripts-command">{script.command}</code>
              </div>
              <button
                type="button"
                className="npm-scripts-run"
                disabled={readOnly || !isReady || Boolean(activeRun)}
                title={t('scripts.runTitle', { name: script.name })}
                onClick={() => handleRun(script.name)}
              >
                <Play size={12} />
                {running ? t('scripts.running') : t('scripts.run')}
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
