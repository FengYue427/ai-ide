import { useMemo, useState } from 'react'
import { useI18n, type Language } from '../i18n'
import {
  filterSpecCatalog,
  sortSpecCatalog,
  type SpecCatalogItem,
  type SpecCatalogSort,
} from '../services/specCatalogService'
import type { PlanSpecLink } from '../services/planSpecLinkService'

interface SpecCatalogSectionProps {
  language: Language
  specs: SpecCatalogItem[]
  specLinkCounts?: Record<string, number>
  specSources?: Record<string, string[]>
  specPlanLinks?: Record<string, PlanSpecLink[]>
  onCreateSpec: (name: string, language: Language) => void
  onOpenLinkedPlan?: (planPath: string, stepLine?: number) => void
  onOpenSpecsRoot: () => void
  onOpenSpecTasks: (tasksPath: string) => void
  onOpenSpecAcceptance: (tasksPath: string) => void
  onRunFirstOpenTask: (tasksPath: string) => void
}

export function SpecCatalogSection({
  language,
  specs,
  specLinkCounts = {},
  specSources = {},
  specPlanLinks = {},
  onCreateSpec,
  onOpenLinkedPlan,
  onOpenSpecsRoot,
  onOpenSpecTasks,
  onOpenSpecAcceptance,
  onRunFirstOpenTask,
}: SpecCatalogSectionProps) {
  const { t } = useI18n()
  const [specName, setSpecName] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SpecCatalogSort>('recent-exec')
  const [visibleCount, setVisibleCount] = useState(8)
  const filtered = useMemo(() => sortSpecCatalog(filterSpecCatalog(specs, query), sortBy), [specs, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">{t('spec.catalog.title')}</div>
      <div className="settings-row-desc">{t('spec.catalog.desc')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={specName}
          placeholder="例如: auth-refactor"
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
          <option value="title">{t('spec.catalog.sort.title')}</option>
        </select>
      </div>

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            已显示 {items.length} / {filtered.length} 个 Spec
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((spec) => (
              <div
                key={spec.tasksPath}
                style={{ display: 'grid', gap: 6, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{spec.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {spec.specName} · 未完成 {spec.uncheckedTasks}/{spec.totalTasks}
                  {spec.lastExecutedAt ? ` · 最近执行 ${spec.lastExecutedAt}` : ''}
                  {(specLinkCounts[spec.tasksPath] ?? 0) > 0 ? ` · 来源 ${specLinkCounts[spec.tasksPath]}` : ''}
                </div>
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
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenSpecAcceptance(spec.tasksPath)}>
                    acceptance
                  </button>
                  {spec.uncheckedTasks > 0 ? (
                    <button type="button" className="btn btn-secondary" onClick={() => onRunFirstOpenTask(spec.tasksPath)}>
                      {t('spec.catalog.runFirst')}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
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
