import { useMemo, useState } from 'react'
import { filterPlanCatalog, sortPlanCatalog, type PlanCatalogItem, type PlanCatalogSort } from '../services/planCatalogService'

interface PlansSectionProps {
  plans: PlanCatalogItem[]
  onOpenPlan: (path: string) => void
  onDeletePlan: (path: string) => void
  onRunPlan: (path: string, steps: string[]) => void
  onMapPlanToSpec: (path: string, steps: string[]) => void
}

function planLabelFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

export function PlansSection({ plans, onOpenPlan, onDeletePlan, onRunPlan, onMapPlanToSpec }: PlansSectionProps) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<PlanCatalogSort>('recent-exec')
  const [selectedSteps, setSelectedSteps] = useState<Record<string, Record<string, boolean>>>({})
  const items = useMemo(() => sortPlanCatalog(filterPlanCatalog(plans, query), sortBy).slice(0, 8), [plans, query, sortBy])

  const selectedCount = (path: string) =>
    Object.values(selectedSteps[path] ?? {}).filter(Boolean).length

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">Plan 管理（多计划）</div>
      <div className="settings-row-desc">
        管理 `.aide/plans/` 下的计划文件：筛选、排序、摘要查看，并可选择多个步骤执行（执行结果会回填到 plan 文件）。
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder="搜索计划名 / 路径 / 标签"
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 180 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as PlanCatalogSort)}
        >
          <option value="recent-exec">按最近执行</option>
          <option value="most-open">按未完成步骤数</option>
          <option value="title">按标题</option>
        </select>
      </div>

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>最近计划（最多 8 条）</div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((plan) => (
              <div key={plan.path} style={{ display: 'grid', gap: 8, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {plan.title || planLabelFromPath(plan.path)}
                  </span>
                  <span className="settings-badge settings-badge--enabled">待办 {plan.uncheckedSteps}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {plan.path} {plan.lastExecutedAt ? `· 最近执行 ${plan.lastExecutedAt}` : '· 尚未执行'}
                </div>
                {plan.stepItems.length > 0 ? (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {plan.stepItems.slice(0, 4).map((step) => {
                      const key = `${step.line}-${step.text}`
                      const checked = !!selectedSteps[plan.path]?.[key]
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
                          <span>{step.text}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>无未完成步骤</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenPlan(plan.path)}>
                    打开
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={plan.stepItems.length === 0}
                    onClick={() => {
                      const selectedMap = selectedSteps[plan.path] ?? {}
                      const selected = plan.stepItems
                        .filter((step) => selectedMap[`${step.line}-${step.text}`])
                        .map((step) => step.text)
                      onRunPlan(plan.path, selected.length > 0 ? selected : [plan.stepItems[0].text])
                    }}
                  >
                    执行步骤{selectedCount(plan.path) > 0 ? ` (${selectedCount(plan.path)})` : ''}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={plan.stepItems.length === 0}
                    onClick={() => {
                      const selectedMap = selectedSteps[plan.path] ?? {}
                      const selected = plan.stepItems
                        .filter((step) => selectedMap[`${step.line}-${step.text}`])
                        .map((step) => step.text)
                      onMapPlanToSpec(plan.path, selected.length > 0 ? selected : [plan.stepItems[0].text])
                    }}
                  >
                    映射到 Spec
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => onDeletePlan(plan.path)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          还没有计划文件。你可以在 Chat 的 Plan Mode 下生成计划，它会自动保存到 `.aide/plans/`。
        </div>
      )}
    </div>
  )
}

