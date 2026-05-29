import { useMemo, useState } from 'react'
import type { Language } from '../i18n'
import {
  filterSpecCatalog,
  sortSpecCatalog,
  type SpecCatalogItem,
  type SpecCatalogSort,
} from '../services/specCatalogService'

interface SpecCatalogSectionProps {
  language: Language
  specs: SpecCatalogItem[]
  onCreateSpec: (name: string, language: Language) => void
  onOpenSpecsRoot: () => void
  onOpenSpecTasks: (tasksPath: string) => void
  onOpenSpecAcceptance: (tasksPath: string) => void
  onRunFirstOpenTask: (tasksPath: string) => void
}

export function SpecCatalogSection({
  language,
  specs,
  onCreateSpec,
  onOpenSpecsRoot,
  onOpenSpecTasks,
  onOpenSpecAcceptance,
  onRunFirstOpenTask,
}: SpecCatalogSectionProps) {
  const [specName, setSpecName] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SpecCatalogSort>('recent-exec')
  const [visibleCount, setVisibleCount] = useState(8)
  const filtered = useMemo(() => sortSpecCatalog(filterSpecCatalog(specs, query), sortBy), [specs, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">Specs 目录（.aide/specs）</div>
      <div className="settings-row-desc">
        按 Spec 浏览任务进度，支持搜索、排序，并打开 tasks / acceptance。
      </div>
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
          创建 Spec
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenSpecsRoot}>
          打开 Specs
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder="搜索 Spec 名称 / 标题"
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SpecCatalogSort)}
        >
          <option value="recent-exec">最近执行</option>
          <option value="most-open">未完成最多</option>
          <option value="title">按标题</option>
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
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenSpecTasks(spec.tasksPath)}>
                    tasks
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenSpecAcceptance(spec.tasksPath)}>
                    acceptance
                  </button>
                  {spec.uncheckedTasks > 0 ? (
                    <button type="button" className="btn btn-secondary" onClick={() => onRunFirstOpenTask(spec.tasksPath)}>
                      执行首条未完成
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {items.length < filtered.length ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((c) => c + 8)}>
                显示更多
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>还没有 Spec，可先创建一个。</div>
      )}
    </div>
  )
}
