import { useEffect, type FC } from 'react'
import { ArrowDownToLine, ArrowRightToLine, ArrowUpFromLine, Bug, Play, Square } from 'lucide-react'
import { useI18n } from '../i18n'
import { canUseDebugExecutionControls } from '../lib/debugSessionActive'
import {
  formatHitCountForInput,
  parseHitCountInput,
} from '../lib/debugBreakpointHitCount'
import { breakpointHasAdvancedOptions } from '../lib/debugBreakpoints'
import { MAX_DEBUG_WATCH_EXPRESSIONS } from '../lib/debugWatch'
import { inspectDebugStackFrame } from '../services/debugInspectService'
import { refreshDebugWatchResults } from '../services/debugWatchService'
import {
  getActiveDebugClient,
  getCachedDebugCallStack,
  syncActiveDebugBreakpoints,
} from '../services/debugSessionService'
import { canUseDesktopDebug } from '../services/desktopDebug'
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
  const updateDebugBreakpointMeta = useIDEStore((s) => s.updateDebugBreakpointMeta)
  const debugWatchExpressions = useIDEStore((s) => s.debugWatchExpressions)
  const setDebugWatchSlot = useIDEStore((s) => s.setDebugWatchSlot)
  const debugSession = useIDEStore((s) => s.debugSession)
  const setDebugSession = useIDEStore((s) => s.setDebugSession)
  const files = useIDEStore((s) => s.files)
  const activeFile = useIDEStore((s) => s.activeFile)
  const entryName = files[activeFile]?.name ?? 'index.js'

  const runtimeReady = isReady || canUseDesktopDebug()
  const phaseLabel = t(`debug.phase.${debugSession.phase}`)
  const runtimeLabel =
    debugSession.runtimeKind === 'desktop'
      ? t('debug.runtimeDesktop')
      : debugSession.runtimeKind === 'webcontainer'
        ? t('debug.runtimeWebContainer')
        : canUseDesktopDebug()
          ? t('debug.runtimeDesktop')
          : null
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
      watchResults: [],
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
  const cdpActive = debugSession.syncMode === 'cdp' && Boolean(getActiveDebugClient())

  useEffect(() => {
    if (!isPaused || showInspectHint) {
      if (!isPaused && debugSession.watchResults.length > 0) {
        setDebugSession({ watchResults: [] })
      }
      return
    }

    let cancelled = false
    void refreshDebugWatchResults(
      debugWatchExpressions,
      debugSession.callStack,
      debugSession.activeStackFrameIndex,
    ).then((results) => {
      if (!cancelled) setDebugSession({ watchResults: results })
    })

    return () => {
      cancelled = true
    }
  }, [
    isPaused,
    showInspectHint,
    debugWatchExpressions,
    debugSession.callStack,
    debugSession.activeStackFrameIndex,
    setDebugSession,
  ])

  const commitBreakpointMeta = async (
    path: string,
    line: number,
    condition: string,
    hitCountRaw: string,
  ) => {
    updateDebugBreakpointMeta(path, line, {
      condition,
      hitCount: parseHitCountInput(hitCountRaw),
    })
    if (!cdpActive) return
    const registered = await syncActiveDebugBreakpoints(useIDEStore.getState().debugBreakpoints)
    if (registered != null) {
      useIDEStore.getState().setDebugSession({ registeredBreakpointCount: registered })
    }
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span className="debug-panel-badge">{t('debug.gaBadge')}</span>
        <span className="debug-panel-phase">{phaseLabel}</span>
      </div>

      {!runtimeReady ? (
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

          {runtimeLabel || syncLabel ? (
            <p className="debug-panel-meta">
              {[runtimeLabel, syncLabel].filter(Boolean).join(' · ')}
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
          {debugSession.syncMode === 'injected' ? (
            <p className="debug-panel-hint debug-panel-hint--warn">{t('debug.conditionalInjectHint')}</p>
          ) : (
            <p className="debug-panel-hint">{t('debug.conditionalCdpHint')}</p>
          )}

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

              <section className="debug-panel-section" aria-label={t('debug.watchTitle')}>
                <h4>{t('debug.watchTitle')}</h4>
                {showInspectHint ? (
                  <p className="debug-panel-empty">{t('debug.watchRequiresCdp')}</p>
                ) : (
                  <>
                    <p className="debug-panel-hint">{t('debug.watchHint')}</p>
                    <ul className="debug-panel-list debug-panel-watch-list">
                      {Array.from({ length: MAX_DEBUG_WATCH_EXPRESSIONS }, (_, index) => {
                        const expression = debugWatchExpressions[index] ?? ''
                        const result = debugSession.watchResults[index]
                        return (
                          <li key={`watch-${index}`} className="debug-panel-watch-item">
                            <input
                              type="text"
                              className="debug-panel-bp-input debug-panel-watch-input"
                              defaultValue={expression}
                              key={`watch-input-${index}-${expression}`}
                              placeholder={t('debug.watchPlaceholder', { n: index + 1 })}
                              disabled={readOnly}
                              spellCheck={false}
                              aria-label={t('debug.watchSlotLabel', { n: index + 1 })}
                              onBlur={(event) => setDebugWatchSlot(index, event.target.value)}
                            />
                            {isPaused && expression.trim() ? (
                              result?.error ? (
                                <span className="debug-panel-watch-error" title={result.error}>
                                  {result.error}
                                </span>
                              ) : (
                                <span className="debug-panel-watch-value" title={result?.valuePreview}>
                                  {result?.valuePreview || t('debug.watchEmptyValue')}
                                </span>
                              )
                            ) : isPaused ? (
                              <span className="debug-panel-watch-muted">{t('debug.watchPausedEmpty')}</span>
                            ) : (
                              <span className="debug-panel-watch-muted">{t('debug.watchResumeHint')}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </section>
            </>
          ) : (
            <section className="debug-panel-section" aria-label={t('debug.watchTitle')}>
              <h4>{t('debug.watchTitle')}</h4>
              <p className="debug-panel-hint">{t('debug.watchHint')}</p>
              <ul className="debug-panel-list debug-panel-watch-list">
                {Array.from({ length: MAX_DEBUG_WATCH_EXPRESSIONS }, (_, index) => (
                  <li key={`watch-idle-${index}`} className="debug-panel-watch-item">
                    <input
                      type="text"
                      className="debug-panel-bp-input debug-panel-watch-input"
                      defaultValue={debugWatchExpressions[index] ?? ''}
                      key={`watch-idle-input-${index}-${debugWatchExpressions[index] ?? ''}`}
                      placeholder={t('debug.watchPlaceholder', { n: index + 1 })}
                      disabled={readOnly}
                      spellCheck={false}
                      aria-label={t('debug.watchSlotLabel', { n: index + 1 })}
                      onBlur={(event) => setDebugWatchSlot(index, event.target.value)}
                    />
                    <span className="debug-panel-watch-muted">{t('debug.watchResumeHint')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="debug-panel-section" aria-label={t('debug.breakpointsTitle')}>
            <h4>{t('debug.breakpointsTitle')}</h4>
            {debugBreakpoints.length === 0 ? (
              <p className="debug-panel-empty">{t('debug.breakpointsEmpty')}</p>
            ) : (
              <ul className="debug-panel-list debug-panel-bp-list">
                {debugBreakpoints.map((bp) => (
                  <li
                    key={bp.id}
                    className={`debug-panel-list-item debug-panel-bp-item${
                      breakpointHasAdvancedOptions(bp) ? ' debug-panel-bp-item--advanced' : ''
                    }`}
                  >
                    <label className="debug-panel-bp-toggle">
                      <input
                        type="checkbox"
                        checked={bp.enabled}
                        disabled={readOnly}
                        onChange={(event) => {
                          setDebugBreakpointEnabled(bp.path, bp.line, event.target.checked)
                          if (!cdpActive) return
                          void syncActiveDebugBreakpoints(useIDEStore.getState().debugBreakpoints).then(
                            (registered) => {
                              if (registered != null) {
                                useIDEStore.getState().setDebugSession({
                                  registeredBreakpointCount: registered,
                                })
                              }
                            },
                          )
                        }}
                      />
                      <span>{bp.path}</span>
                      <span className="debug-panel-line">:{bp.line}</span>
                    </label>
                    <div className="debug-panel-bp-fields">
                      <label className="debug-panel-bp-field">
                        <span className="debug-panel-bp-field-label">{t('debug.breakpointCondition')}</span>
                        <input
                          type="text"
                          className="debug-panel-bp-input"
                          defaultValue={bp.condition ?? ''}
                          key={`${bp.id}-cond-${bp.condition ?? ''}`}
                          placeholder={t('debug.breakpointConditionPlaceholder')}
                          disabled={readOnly}
                          spellCheck={false}
                          onBlur={(event) => {
                            const latest = useIDEStore
                              .getState()
                              .debugBreakpoints.find((item) => item.id === bp.id)
                            void commitBreakpointMeta(
                              bp.path,
                              bp.line,
                              event.target.value,
                              formatHitCountForInput(latest?.hitCount),
                            )
                          }}
                        />
                      </label>
                      <label className="debug-panel-bp-field debug-panel-bp-field--narrow">
                        <span className="debug-panel-bp-field-label">{t('debug.breakpointHitCount')}</span>
                        <input
                          type="number"
                          min={2}
                          className="debug-panel-bp-input"
                          defaultValue={formatHitCountForInput(bp.hitCount)}
                          key={`${bp.id}-hits-${bp.hitCount ?? ''}`}
                          placeholder="2"
                          disabled={readOnly}
                          onBlur={(event) => {
                            const latest = useIDEStore
                              .getState()
                              .debugBreakpoints.find((item) => item.id === bp.id)
                            void commitBreakpointMeta(
                              bp.path,
                              bp.line,
                              latest?.condition ?? '',
                              event.target.value,
                            )
                          }}
                        />
                      </label>
                    </div>
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
