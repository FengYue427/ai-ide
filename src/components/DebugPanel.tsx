import type { FC } from 'react'
import { ArrowDownToLine, ArrowRightToLine, ArrowUpFromLine, Bug, Play, Square } from 'lucide-react'
import { useI18n } from '../i18n'
import { canUseDebugExecutionControls } from '../lib/debugSessionActive'
import { inspectDebugStackFrame } from '../services/debugInspectService'
import { getActiveDebugClient, getCachedDebugCallStack } from '../services/debugSessionService'
import { useIDEStore } from '../store/ideStore'
import { InlineStatePanel } from './InlineStatePanel'

interface DebugPanelProps {
  readOnly?: boolean
  isReady: boolean
  isRunning: boolean
  debugSessionActive: boolean
  onStartDebug: () => void
  onStopDebug: () => void
  onDebugContinue: () => void
  onDebugStepOver: () => void
  onDebugStepInto: () => void
  onDebugStepOut: () => void
}

export const DebugPanel: FC<DebugPanelProps> = ({
  readOnly = false,
  isReady,
  isRunning,
  debugSessionActive,
  onStartDebug,
  onStopDebug,
  onDebugContinue,
  onDebugStepOver,
  onDebugStepInto,
  onDebugStepOut,
}) => {
  const { t } = useI18n()
  const debugBreakpoints = useIDEStore((s) => s.debugBreakpoints)
  const setDebugBreakpointEnabled = useIDEStore((s) => s.setDebugBreakpointEnabled)
  const debugSession = useIDEStore((s) => s.debugSession)
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const entryName = files[activeFile]?.name ?? 'index.js'

  const phaseLabel = t(`debug.phase.${debugSession.phase}`)
  const syncLabel =
    debugSession.syncMode === 'cdp'
      ? t('debug.syncModeCdp')
      : debugSession.syncMode === 'injected'
        ? t('debug.syncModeInjected')
        : null

  const handleSelectStackFrame = async (index: number) => {
    const stack = getCachedDebugCallStack()
    const inspection = await inspectDebugStackFrame(getActiveDebugClient(), stack, index)
    if (!inspection) return

    const state = useIDEStore.getState()
    state.setDebugSession({
      activeStackFrameIndex: index,
      pausedAt: inspection.location,
      locals: inspection.locals,
    })

    const fileIndex = files.findIndex((item) => item.name === inspection.location.path)
    if (fileIndex >= 0) {
      state.setActiveFile(fileIndex)
      state.setEditorTarget({ line: inspection.location.line, column: 1, nonce: Date.now() })
    }
  }

  const showInspectHint = debugSession.syncMode !== 'cdp'
  const isPaused = debugSession.phase === 'paused'
  const canExecute = canUseDebugExecutionControls(debugSession)

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span className="debug-panel-badge">{t('debug.gaBadge')}</span>
        <span className="debug-panel-phase">{phaseLabel}</span>
      </div>

      {!isReady ? (
        <InlineStatePanel
          compact
          tone="hint"
          icon={Bug}
          title={t('debug.waitRuntimeTitle')}
          description={t('debug.waitRuntimeDesc')}
        />
      ) : (
        <>
          <div className="debug-panel-actions">
            <button
              type="button"
              className="debug-panel-btn debug-panel-btn--primary"
              disabled={readOnly || isRunning || debugSessionActive}
              onClick={onStartDebug}
            >
              <Play size={14} />
              {t('debug.start', { file: entryName })}
            </button>
            <button
              type="button"
              className="debug-panel-btn"
              disabled={!canExecute}
              title={t('debug.continueHint')}
              onClick={onDebugContinue}
            >
              <Play size={14} />
              {t('debug.continue')}
            </button>
            <button
              type="button"
              className="debug-panel-btn"
              disabled={!canExecute}
              title={t('debug.stepOverHint')}
              onClick={onDebugStepOver}
            >
              <ArrowDownToLine size={14} />
              {t('debug.stepOver')}
            </button>
            <button
              type="button"
              className="debug-panel-btn"
              disabled={!canExecute}
              title={t('debug.stepIntoHint')}
              onClick={onDebugStepInto}
            >
              <ArrowRightToLine size={14} />
              {t('debug.stepInto')}
            </button>
            <button
              type="button"
              className="debug-panel-btn"
              disabled={!canExecute}
              title={t('debug.stepOutHint')}
              onClick={onDebugStepOut}
            >
              <ArrowUpFromLine size={14} />
              {t('debug.stepOut')}
            </button>
            <button
              type="button"
              className="debug-panel-btn"
              disabled={!debugSessionActive}
              title={t('debug.stopHint')}
              onClick={onStopDebug}
            >
              <Square size={14} />
              {t('debug.stop')}
            </button>
          </div>

          {syncLabel ? (
            <p className="debug-panel-meta">
              {syncLabel}
              {debugSession.registeredBreakpointCount > 0
                ? ` · ${t('debug.breakpointsRegistered', { count: debugSession.registeredBreakpointCount })}`
                : null}
            </p>
          ) : null}

          {debugSession.pausedAt ? (
            <p className="debug-panel-meta">
              {t('debug.pausedAt', {
                file: debugSession.pausedAt.path,
                line: debugSession.pausedAt.line,
              })}
            </p>
          ) : null}

          {debugSession.inspectUrl ? (
            <p className="debug-panel-url" title={debugSession.inspectUrl}>
              <strong>{t('debug.inspectUrl')}</strong>
              <code>{debugSession.inspectUrl}</code>
            </p>
          ) : null}

          {debugSession.error ? (
            <p className="debug-panel-error" role="alert">
              {debugSession.error}
            </p>
          ) : null}

          <p className="debug-panel-hint">{t('debug.breakpointHint')}</p>

          {isPaused ? (
            <>
              <section className="debug-panel-section" aria-label={t('debug.callStackTitle')}>
                <h4>{t('debug.callStackTitle')}</h4>
                {showInspectHint ? (
                  <p className="debug-panel-empty">{t('debug.inspectRequiresCdp')}</p>
                ) : debugSession.callStack.length === 0 ? (
                  <p className="debug-panel-empty">{t('debug.callStackEmpty')}</p>
                ) : (
                  <ul className="debug-panel-list debug-panel-stack">
                    {debugSession.callStack.map((frame, index) => (
                      <li key={frame.id} className="debug-panel-list-item">
                        <button
                          type="button"
                          className={`debug-panel-stack-btn${
                            index === debugSession.activeStackFrameIndex
                              ? ' debug-panel-stack-btn--active'
                              : ''
                          }`}
                          onClick={() => void handleSelectStackFrame(index)}
                        >
                          <span className="debug-panel-stack-fn">{frame.functionName}</span>
                          <span className="debug-panel-line">
                            {frame.path}:{frame.line}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="debug-panel-section" aria-label={t('debug.localsTitle')}>
                <h4>{t('debug.localsTitle')}</h4>
                {showInspectHint ? (
                  <p className="debug-panel-empty">{t('debug.inspectRequiresCdp')}</p>
                ) : debugSession.locals.length === 0 ? (
                  <p className="debug-panel-empty">{t('debug.localsEmpty')}</p>
                ) : (
                  <ul className="debug-panel-list debug-panel-locals">
                    {debugSession.locals.map((entry) => (
                      <li key={entry.name} className="debug-panel-local">
                        <span className="debug-panel-local-name">{entry.name}</span>
                        <span className="debug-panel-local-value" title={entry.type}>
                          {entry.valuePreview}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}

          <section className="debug-panel-section" aria-label={t('debug.breakpointsTitle')}>
            <h4>{t('debug.breakpointsTitle')}</h4>
            {debugBreakpoints.length === 0 ? (
              <p className="debug-panel-empty">{t('debug.breakpointsEmpty')}</p>
            ) : (
              <ul className="debug-panel-list">
                {debugBreakpoints.map((bp) => (
                  <li key={bp.id} className="debug-panel-list-item">
                    <label className="debug-panel-bp-toggle">
                      <input
                        type="checkbox"
                        checked={bp.enabled}
                        disabled={readOnly}
                        onChange={(event) =>
                          setDebugBreakpointEnabled(bp.path, bp.line, event.target.checked)
                        }
                      />
                      <span>{bp.path}</span>
                      <span className="debug-panel-line">:{bp.line}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
