import { useCallback, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { gatePlanBackgroundBatch } from '../lib/planBackgroundBatchGate'
import { getClientEntitlements } from '../lib/clientPlanEntitlements'
import { filterPlanCatalog, sortPlanCatalog, type PlanCatalogItem, type PlanCatalogSort } from '../services/planCatalogService'
import type { PlanTemplateItem } from '../services/planTemplateService'
import { useIDEStore } from '../store/ideStore'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'

interface PlansSectionProps {
  plans: PlanCatalogItem[]
  specTaskPaths: string[]
  planLinkCounts?: Record<string, number>
  planTemplates?: PlanTemplateItem[]
  onCreateFromTemplate?: (templateId: string, planTitle: string) => void
  onOpenPlan: (path: string) => void
  onDeletePlan: (path: string) => void
  onRunPlan: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onRunPlanInBackground?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onMapPlanToSpec: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  onMapPlanToSpecAndRun: (path: string, steps: Array<{ text: string; line?: number }>, targetSpecPath?: string) => void
  getLinkedSpecPath?: (planPath: string, stepText: string) => string | null
  onOpenLinkedSpec?: (specTasksPath: string) => void
  onMarkPlanStepsDone?: (path: string, steps: Array<{ text: string; line?: number }>) => void
  onDuplicatePlan?: (path: string) => void
}

function planLabelFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

function linkKey(path: string, text: string): string {
  return `${path}::${text.trim().toLowerCase()}`
}

export function PlansSection({
  plans,
  specTaskPaths,
  planLinkCounts = {},
  planTemplates = [],
  onCreateFromTemplate,
  onOpenPlan,
  onDeletePlan,
  onRunPlan,
  onRunPlanInBackground,
  onMapPlanToSpec,
  onMapPlanToSpecAndRun,
  getLinkedSpecPath,
  onOpenLinkedSpec,
  onMarkPlanStepsDone,
  onDuplicatePlan,
}: PlansSectionProps) {
  const { t } = useI18n()
  const currentPlan = useIDEStore((s) => s.currentPlan)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const jobEntitlements = useMemo(
    () => getClientEntitlements(currentPlan ?? 'free'),
    [currentPlan],
  )
  const batchMax = jobEntitlements.backgroundJobsBatchMax
  const isTeamPlan = jobEntitlements.planName === 'enterprise'
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<PlanCatalogSort>('recent-exec')
  const [visibleCount, setVisibleCount] = useState(8)
  const [targetSpecPath, setTargetSpecPath] = useState('')
  const [templateId, setTemplateId] = useState(planTemplates[0]?.id ?? 'feature-dev')
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [selectedSteps, setSelectedSteps] = useState<Record<string, Record<string, boolean>>>({})
  const filtered = useMemo(() => sortPlanCatalog(filterPlanCatalog(plans, query), sortBy), [plans, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  const selectedCount = (path: string) =>
    Object.values(selectedSteps[path] ?? {}).filter(Boolean).length

  const openUpgrade = useCallback(() => setShowSubscriptionModal(true), [setShowSubscriptionModal])

  const runPlanInBackground = useCallback(
    (path: string, steps: Array<{ text: string; line?: number }>) => {
      if (!onRunPlanInBackground) return
      const gate = gatePlanBackgroundBatch(currentPlan ?? 'free', steps.length)
      if (!gate.ok) {
        if (gate.reason === 'upgrade-required') openUpgrade()
        return
      }
      onRunPlanInBackground(path, steps)
    },
    [currentPlan, onRunPlanInBackground, openUpgrade],
  )

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">{t('plan.catalog.title')}</div>
      <div className="settings-row-desc">{t('plan.catalog.desc')}</div>
      {onRunPlanInBackground ? (
        <div
          className={`plan-batch-quota${isTeamPlan ? ' plan-batch-quota--team' : ''}`}
          data-testid="plan-batch-quota"
        >
          <span>
            {batchMax === 0
              ? t('plan.catalog.batchQuotaFree')
              : t('plan.catalog.batchQuotaPaid', { batch: batchMax })}
          </span>
          {isTeamPlan ? (
            <span className="plan-batch-quota__team-badge">{t('entitlements.card.teamPlus')}</span>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={openUpgrade}>
              {batchMax === 0 ? t('backgroundJobs.upgradePro') : t('entitlements.card.upgradeTeam')}
            </button>
          )}
        </div>
      ) : null}
      {onRunPlanInBackground && batchMax === 0 ? (
        <UpgradeEntitlementHint compact feature="planBatch" onUpgrade={openUpgrade} />
      ) : null}
      {onCreateFromTemplate && planTemplates.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <select
            className="settings-select"
            style={{ minWidth: 180 }}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {planTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
                {template.source === 'workspace' ? t('plan.catalog.templateCustom') : ''}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="settings-input"
            style={{ flex: 1, minWidth: 180 }}
            value={newPlanTitle}
            placeholder={t('plan.catalog.newPlanPlaceholder')}
            onChange={(e) => setNewPlanTitle(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onCreateFromTemplate(templateId, newPlanTitle.trim() || t('plan.catalog.newPlanPlaceholder'))}
          >
            {t('plan.catalog.createFromTemplate')}
          </button>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder={t('plan.catalog.searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 180 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as PlanCatalogSort)}
        >
          <option value="recent-exec">{t('plan.catalog.sort.recentExec')}</option>
          <option value="most-open">{t('plan.catalog.sort.mostOpen')}</option>
          <option value="title">{t('plan.catalog.sort.title')}</option>
        </select>
        {specTaskPaths.length > 0 ? (
          <select
            className="settings-select"
            style={{ minWidth: 280 }}
            value={targetSpecPath}
            onChange={(e) => setTargetSpecPath(e.target.value)}
            title={t('plan.catalog.mapTargetTitle')}
          >
            <option value="">{t('plan.catalog.mapTargetDefault')}</option>
            {specTaskPaths.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('plan.catalog.shownCount', { shown: items.length, total: filtered.length })}
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((plan) => (
              <div key={plan.path} style={{ display: 'grid', gap: 8, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {plan.title || planLabelFromPath(plan.path)}
                  </span>
                  <span className="settings-badge settings-badge--enabled">
                    {t('plan.catalog.todoBadge', { count: plan.uncheckedSteps })}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {plan.path}{' '}
                  {plan.lastExecutedAt
                    ? `· ${t('plan.catalog.lastExecuted', { time: plan.lastExecutedAt })}`
                    : `· ${t('plan.catalog.notExecuted')}`}
                </div>
                {plan.stepItems.length > 0 ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {plan.stepItems.slice(0, 4).map((step) => {
                      const key = `${step.line}-${step.text}`
                      const checked = !!selectedSteps[plan.path]?.[key]
                      const mappedCount = planLinkCounts[linkKey(plan.path, step.text)] ?? 0
                      return (
                        <label key={key} style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedSteps((prev) => ({
                                ...prev,
                                [plan.path]: { ...(prev[plan.path] ?? {}), [key]: !checked },
                              }))
                            }
                          />
                          <span style={{ flex: 1 }}>
                            {step.text}
                            {mappedCount > 0 ? (
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 11 }}>
                                {t('plan.catalog.mappedCount', { count: mappedCount })}
                                {getLinkedSpecPath && onOpenLinkedSpec ? (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0 6px', fontSize: 11, marginLeft: 6 }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      const specPath = getLinkedSpecPath(plan.path, step.text)
                                      if (specPath) onOpenLinkedSpec(specPath)
                                    }}
                                  >
                                    {t('plan.catalog.openLinkedSpec')}
                                  </button>
                                ) : null}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('plan.catalog.noOpenSteps')}</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenPlan(plan.path)}>
                    {t('plan.catalog.open')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={plan.stepItems.length === 0}
                    onClick={() => {
                      const selectedMap = selectedSteps[plan.path] ?? {}
                      const selected = plan.stepItems
                        .filter((step) => selectedMap[`${step.line}-${step.text}`])
                        .map((step) => ({ text: step.text, line: step.line }))
                      onRunPlan(plan.path, selected.length > 0 ? selected : [{ text: plan.stepItems[0].text, line: plan.stepItems[0].line }])
                    }}
                  >
                    {t('plan.catalog.runSteps')}
                    {selectedCount(plan.path) > 0 ? ` (${selectedCount(plan.path)})` : ''}
                  </button>
                  {onRunPlanInBackground ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={plan.stepItems.length === 0}
                      onClick={() => {
                        const selectedMap = selectedSteps[plan.path] ?? {}
                        const selected = plan.stepItems
                          .filter((step) => selectedMap[`${step.line}-${step.text}`])
                          .map((step) => ({ text: step.text, line: step.line }))
                        runPlanInBackground(
                          plan.path,
                          selected.length > 0
                            ? selected
                            : [{ text: plan.stepItems[0].text, line: plan.stepItems[0].line }],
                        )
                      }}
                    >
                      {t('plan.catalog.runInBackground')}
                      {selectedCount(plan.path) > 0 ? ` (${selectedCount(plan.path)})` : ''}
                    </button>
                  ) : null}
                  {plan.stepItems.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        onRunPlan(
                          plan.path,
                          plan.stepItems.map((step) => ({ text: step.text, line: step.line })),
                        )
                      }
                    >
                      {t('plan.catalog.queueAllOpen', { count: plan.stepItems.length })}
                    </button>
                  ) : null}
                  {onRunPlanInBackground && plan.stepItems.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        runPlanInBackground(
                          plan.path,
                          plan.stepItems.map((step) => ({ text: step.text, line: step.line })),
                        )
                      }
                    >
                      {t('plan.catalog.runAllInBackground', { count: plan.stepItems.length })}
                    </button>
                  ) : null}
                  {onMarkPlanStepsDone ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={plan.stepItems.length === 0}
                      onClick={() => {
                        const selectedMap = selectedSteps[plan.path] ?? {}
                        const selected = plan.stepItems
                          .filter((step) => selectedMap[`${step.line}-${step.text}`])
                          .map((step) => ({ text: step.text, line: step.line }))
                        onMarkPlanStepsDone(
                          plan.path,
                          selected.length > 0
                            ? selected
                            : plan.stepItems.map((step) => ({ text: step.text, line: step.line })),
                        )
                      }}
                    >
                      {t('plan.catalog.markDone')}
                      {selectedCount(plan.path) > 0 ? ` (${selectedCount(plan.path)})` : ''}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={plan.stepItems.length === 0}
                    onClick={() => {
                      const selectedMap = selectedSteps[plan.path] ?? {}
                      const selected = plan.stepItems
                        .filter((step) => selectedMap[`${step.line}-${step.text}`])
                        .map((step) => ({ text: step.text, line: step.line }))
                      onMapPlanToSpec(
                        plan.path,
                        selected.length > 0 ? selected : [{ text: plan.stepItems[0].text, line: plan.stepItems[0].line }],
                        targetSpecPath || undefined,
                      )
                    }}
                  >
                    {t('plan.catalog.map')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={plan.stepItems.length === 0}
                    onClick={() => {
                      const selectedMap = selectedSteps[plan.path] ?? {}
                      const selected = plan.stepItems
                        .filter((step) => selectedMap[`${step.line}-${step.text}`])
                        .map((step) => ({ text: step.text, line: step.line }))
                      onMapPlanToSpecAndRun(
                        plan.path,
                        selected.length > 0 ? selected : [{ text: plan.stepItems[0].text, line: plan.stepItems[0].line }],
                        targetSpecPath || undefined,
                      )
                    }}
                  >
                    {t('plan.catalog.mapAndRun')}
                  </button>
                  {onDuplicatePlan ? (
                    <button type="button" className="btn btn-secondary" onClick={() => onDuplicatePlan(plan.path)}>
                      {t('plan.catalog.duplicate')}
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-secondary" onClick={() => onDeletePlan(plan.path)}>
                    {t('plan.catalog.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length < filtered.length ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + 8)}>
                {t('plan.catalog.showMore')}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t('plan.catalog.empty')}
        </div>
      )}
    </div>
  )
}

