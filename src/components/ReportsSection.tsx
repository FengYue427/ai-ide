import { useMemo, useState } from 'react'
import {
  filterReportCatalog,
  sortReportCatalog,
  type ReportCatalogItem,
  type ReportCatalogSort,
} from '../services/reportCatalogService'

interface ReportsSectionProps {
  reports: ReportCatalogItem[]
  onOpenReport: (path: string) => void
  onDeleteReport: (path: string) => void
}

function formatGeneratedAt(value: string | null): string {
  if (!value) return '时间未知'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Date(parsed).toLocaleString()
}

export function ReportsSection({ reports, onOpenReport, onDeleteReport }: ReportsSectionProps) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<ReportCatalogSort>('recent')
  const [visibleCount, setVisibleCount] = useState(8)
  const filtered = useMemo(() => sortReportCatalog(filterReportCatalog(reports, query), sortBy), [reports, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">执行报告（.aide/reports）</div>
      <div className="settings-row-desc">
        查看 Chat 保存的队列执行报告：支持搜索、按时间排序、打开与删除。
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder="搜索报告标题 / 路径 / 状态"
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ReportCatalogSort)}
        >
          <option value="recent">按生成时间</option>
          <option value="title">按标题</option>
        </select>
      </div>

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            已显示 {items.length} / {filtered.length} 条报告
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((report) => (
              <div
                key={report.path}
                style={{ display: 'grid', gap: 6, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {report.title}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {report.path} · {formatGeneratedAt(report.generatedAt)}
                </div>
                {report.status || report.summary ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {report.status ? `状态：${report.status}` : ''}
                    {report.status && report.summary ? ' · ' : ''}
                    {report.summary ? `统计：${report.summary}` : ''}
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenReport(report.path)}>
                    打开
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => onDeleteReport(report.path)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length < filtered.length ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + 8)}>
                显示更多
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          还没有报告文件。可在 Chat 任务队列中点击「保存到 .aide/reports」生成。
        </div>
      )}
    </div>
  )
}
