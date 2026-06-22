import { useMemo, useState } from 'react'
import { useI18n, type Language } from '../i18n'
import { dismissSpecHooksGuide, shouldShowSpecHooksGuide } from '../lib/specCatalogOnboarding'
import {
  filterSpecCatalog,
  sortSpecCatalog,
  type SpecCatalogItem,
  type SpecCatalogSort,
} from '../services/specCatalogService'
import type { PlanSpecLink } from '../services/planSpecLinkService'
import type { SpecHooksPreview } from '../services/runtime/specHooksPreview'
import { deriveSpecExecutionStatus, type SpecExecutionStatus } from '../services/runtime/runtimeState'
import { formatRuntimeStateDisplayLines } from '../services/runtime/runtimeStateDisplay'
import type { RuntimeStatePreview } from '../services/runtime/runtimeStatePreview'
import type { SpecDriftItem, SpecDriftReport } from '../services/intentOs/specDriftService'

interface SpecCatalogSectionProps {
  language: Language
  specs: SpecCatalogItem[]
  specLinkCounts?: Record<string, number>
  specSources?: Record<string, string[]>
  specPlanLinks?: Record<string, PlanSpecLink[]>
  specDriftReports?: Record<string, SpecDriftReport>
  specHooksPreviews?: Record<string, SpecHooksPreview>
  runtimeStatePreview?: RuntimeStatePreview | null
  onCreateSpec: (name: string, language: Language) => void
  onOpenLinkedPlan?: (planPath: string, stepLine?: number) => void
  onOpenSpecsRoot: () => void
  onOpenSpecTasks: (tasksPath: string) => void
  onOpenSpecAcceptance: (tasksPath: string) => void
  onOpenSpecHooks?: (tasksPath: string) => void
  onCreateSpecHooks?: (tasksPath: string, specName: string) => void
  onRunFirstOpenTask: (tasksPath: string) => void
  onOpenSpecStudio?: () => void
}

export function SpecCatalogSection({
  language,
  specs,
  specLinkCounts = {},
  specSources = {},
  specPlanLinks = {},
  specDriftReports = {},
  specHooksPreviews = {},
  runtimeStatePreview = null,
  onCreateSpec,
  onOpenLinkedPlan,
  onOpenSpecsRoot,
  onOpenSpecTasks,
  onOpenSpecAcceptance,
  onOpenSpecHooks,
  onCreateSpecHooks,
  onRunFirstOpenTask,
  onOpenSpecStudio,
}: SpecCatalogSectionProps) {
  const { t } = useI18n()
  const [specName, setSpecName] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SpecCatalogSort>('recent-exec')
  const [visibleCount, setVisibleCount] = useState(8)
  const [showHooksGuide, setShowHooksGuide] = useState(() => shouldShowSpecHooksGuide())
  const filtered = useMemo(() => sortSpecCatalog(filterSpecCatalog(specs, query), sortBy), [specs, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const activeSpecPath = runtimeStatePreview?.activeSpecPath ?? null
  const needsHooksGuide =
    showHooksGuide && (specs.length === 0 || specs.some((spec) => !spec.hasHooks))

  const statusLabel = (status: SpecExecutionStatus): string => {
    switch (status) {
      case 'active':
        return t('spec.catalog.status.active')
      case 'completed':
        return t('spec.catalog.status.completed')
      case 'in-progress':
        return t('spec.catalog.status.inProgress')
      default:
        return t('spec.catalog.status.idle')
    }
  }

  const formatDriftItem = (item: SpecDriftItem): string => {
    switch (item.kind) {
      case 'open-task':
        return t('intent.drift.openTasks', { count: String(item.count ?? 0) })
      case 'open-acceptance':
        return t('intent.drift.openAcceptance', { count: String(item.count ?? 0) })
      case 'missing-path':
        return item.path
          ? t('intent.drift.missingPath', { path: item.path })
          : item.message
      default:
        return item.message
    }
  }

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">{t('spec.catalog.title')}</div>
      <div className="settings-row-desc">{t('spec.catalog.desc')}</div>
      {needsHooksGuide ? (
        <div
          className="settings-onboarding-banner"
          role="note"
          data-testid="spec-catalog-hooks-guide"
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 10,
            border: '1px solid color-mix(in srgb, var(--accent-color) 30%, var(--border-color))',
            background: 'color-mix(in srgb, var(--accent-color) 6%, transparent)',
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <strong>{t('spec.catalog.hooksGuide.title')}</strong>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {t('spec.catalog.hooksGuide.desc')}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 10 }}
            onClick={() => {
              dismissSpecHooksGuide()
              setShowHooksGuide(false)
            }}
          >
            {t('spec.catalog.hooksGuide.dismiss')}
          </button>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={specName}
          placeholder={t('spec.catalog.namePlaceholder')}
          onChange={(e) => setSpecName(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onCreateSpec(specName.trim(), language)
            setSpecName('')
          }}
        >
          {t('spec.catalog.create')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenSpecsRoot}>
          {t('spec.catalog.openRoot')}
        </button>
        {onOpenSpecStudio ? (
          <button
            type="button"
            className="btn btn-primary"
            data-testid="spec-catalog-open-studio"
            onClick={onOpenSpecStudio}
          >
            {t('spec.catalog.openStudio')}
          </button>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder={t('spec.catalog.searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SpecCatalogSort)}
        >
          <option value="recent-exec">{t('spec.catalog.sort.recentExec')}</option>
          <option value="most-open">{t('spec.catalog.sort.mostOpen')}</option>
          <option value="most-hooks">{t('spec.catalog.sort.mostHooks')}</option>
          <option value="title">{t('spec.catalog.sort.title')}</option>
        </select>
      </div>

      {runtimeStatePreview?.exists ? (
        <div
          data-testid="spec-runtime-state-summary"
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: 11,
            lineHeight: 1.5,
            color: runtimeStatePreview.parse.ok ? 'var(--text-secondary)' : 'var(--danger-color, #c44)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
            {t('spec.catalog.runtimeStateSummary')}
          </div>
          {runtimeStatePreview.parse.ok ? (
            (runtimeStatePreview.parse.document
              ? formatRuntimeStateDisplayLines(runtimeStatePreview.parse.document, (key, params) =>
                  t(key, params),
                )
              : runtimeStatePreview.summaryLines
            ).map((line) => <div key={line}>{line}</div>)
          ) : (
            runtimeStatePreview.parse.errors.map((err) => <div key={err}>{err}</div>)
          )}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('spec.catalog.visibleCount', { shown: String(items.length), total: String(filtered.length) })}
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((spec) => {
              const execStatus = deriveSpecExecutionStatus(
                spec.tasksPath,
                spec.uncheckedTasks,
                spec.totalTasks,
                spec.lastExecutedAt,
                activeSpecPath,
              )
              const drift = specDriftReports[spec.tasksPath]
              return (
              <div
                key={spec.tasksPath}
                data-testid={`spec-catalog-item-${spec.specName}`}
                style={{ display: 'grid', gap: 6, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{spec.title}</div>
                  <span
                    data-testid={`spec-status-badge-${spec.specName}`}
                    className={`settings-badge ${execStatus === 'active' ? 'settings-badge--experimental' : 'settings-badge--enabled'}`}
                    style={{ fontSize: 10, padding: '2px 6px' }}
                  >
                    {statusLabel(execStatus)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {spec.specName} · {t('spec.catalog.openTasksCount', {
                    open: String(spec.uncheckedTasks),
                    total: String(spec.totalTasks),
                  })}
                  {spec.hasHooks
                    ? ` · ${t('spec.catalog.hooksCount', { count: String(spec.hooksCount) })}`
                    : ''}
                  {!spec.hooksValid && spec.hasHooks ? ` · ${t('spec.catalog.hooksInvalid')}` : ''}
                  {spec.lastExecutedAt
                    ? ` · ${t('spec.catalog.lastExecuted', { at: spec.lastExecutedAt })}`
                    : ''}
                  {(specLinkCounts[spec.tasksPath] ?? 0) > 0
                    ? ` · ${t('spec.catalog.sourceLinks', { count: String(specLinkCounts[spec.tasksPath]) })}`
                    : ''}
                </div>
                {drift && drift.severity !== 'none' ? (
                  <div
                    className={`intent-drift-banner intent-drift-banner--${drift.severity === 'warn' ? 'warn' : 'info'}`}
                    data-testid={`spec-drift-${spec.specName}`}
                  >
                    <div className="intent-drift-banner__body">
                      <span>
                        {t('intent.drift.title')}: {drift.items.map((item) => formatDriftItem(item)).join(' · ')}
                      </span>
                      <div className="intent-drift-banner__actions">
                        <button
                          type="button"
                          className="btn btn-secondary intent-drift-banner__btn"
                          onClick={() => onOpenSpecTasks(spec.tasksPath)}
                        >
                          tasks
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary intent-drift-banner__btn"
                          onClick={() => onOpenSpecAcceptance(spec.tasksPath)}
                        >
                          acceptance
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {spec.lastHookLogLine ? (
                  <div
                    data-testid={`spec-hook-log-${spec.specName}`}
                    style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}
                  >
                    {t('spec.catalog.lastHookLog')}: {spec.lastHookLogLine}
                  </div>
                ) : null}
                {(specPlanLinks[spec.tasksPath]?.length ?? 0) > 0 && onOpenLinkedPlan ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>{t('spec.catalog.sourcePlans')}:</span>
                    {specPlanLinks[spec.tasksPath].map((link) => (
                      <button
                        key={`${link.planPath}-${link.planStepText}`}
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                        onClick={() => onOpenLinkedPlan(link.planPath, link.planStepLine)}
                      >
                        {link.planPath.split('/').pop()}: {link.planStepText.slice(0, 24)}
                        {link.planStepText.length > 24 ? '…' : ''}
                      </button>
                    ))}
                  </div>
                ) : (specSources[spec.tasksPath]?.length ?? 0) > 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t('spec.catalog.sourcePlans')}：{specSources[spec.tasksPath].join('；')}
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenSpecTasks(spec.tasksPath)}>
                    tasks
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-testid={`spec-open-acceptance-${spec.specName}`}
                    onClick={() => onOpenSpecAcceptance(spec.tasksPath)}
                  >
                    acceptance
                  </button>
                  {spec.hasHooks && onOpenSpecHooks ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-testid={`spec-open-hooks-${spec.specName}`}
                      onClick={() => onOpenSpecHooks(spec.tasksPath)}
                    >
                      {t('spec.catalog.openHooks')}
                    </button>
                  ) : null}
                  {!spec.hasHooks && onCreateSpecHooks ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-testid={`spec-create-hooks-${spec.specName}`}
                      onClick={() => onCreateSpecHooks(spec.tasksPath, spec.specName)}
                    >
                      {t('spec.catalog.createHooks')}
                    </button>
                  ) : null}
                  {spec.uncheckedTasks > 0 ? (
                    <button type="button" className="btn btn-secondary" onClick={() => onRunFirstOpenTask(spec.tasksPath)}>
                      {t('spec.catalog.runFirst')}
                    </button>
                  ) : null}
                </div>
                {(() => {
                  const hooks = specHooksPreviews[spec.tasksPath]
                  if (!hooks?.exists) return null
                  return (
                    <div
                      data-testid={`spec-hooks-preview-${spec.specName}`}
                      style={{
                        fontSize: 11,
                        color: hooks.parse.ok ? 'var(--text-secondary)' : 'var(--danger-color, #c44)',
                        lineHeight: 1.5,
                        borderTop: '1px dashed var(--border-color)',
                        paddingTop: 6,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('spec.catalog.hooksPreview')}</div>
                      {hooks.parse.ok ? (
                        hooks.previewLines.map((line) => <div key={line}>{line}</div>)
                      ) : (
                        hooks.parse.errors.map((err) => <div key={err}>{err}</div>)
                      )}
                    </div>
                  )
                })()}
              </div>
            )})}
          </div>
          {items.length < filtered.length ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((c) => c + 8)}>
                {t('spec.catalog.showMore')}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>{t('spec.catalog.empty')}</div>
      )}
    </div>
  )
}
