import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import {
  filterReportCatalog,
  sortReportCatalog,
  type ReportCatalogItem,
  type ReportCatalogSort,
} from '../services/reportCatalogService'
import {
  loadQueueAutoReportPrefs,
  saveQueueAutoReportPrefs,
  type QueueAutoReportPrefs,
} from '../services/queueAutoReportPrefsService'
import {
  formatQueueRestorePreview,
  hasQueueRestoreItems,
  type QueueRestorePreview,
} from '../services/queueReportRestorePreviewService'

interface ReportsSectionProps {
  reports: ReportCatalogItem[]
  onOpenReport: (path: string) => void
  onDeleteReport: (path: string) => void
  onDeleteReports?: (paths: string[]) => void
  onPruneReports?: (keepRecent: number) => void
  onExportReportsZip?: (paths: string[]) => void
  getRestorePreview?: (path: string) => QueueRestorePreview | null
  onRestoreReport?: (path: string) => void
}

function formatGeneratedAt(value: string | null, unknownLabel: string): string {
  if (!value) return unknownLabel
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Date(parsed).toLocaleString()
}

export function ReportsSection({
  reports,
  onOpenReport,
  onDeleteReport,
  onDeleteReports,
  onPruneReports,
  onExportReportsZip,
  getRestorePreview,
  onRestoreReport,
}: ReportsSectionProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<ReportCatalogSort>('recent')
  const [visibleCount, setVisibleCount] = useState(8)
  const [keepRecent, setKeepRecent] = useState(5)
  const [selectedPaths, setSelectedPaths] = useState<Record<string, boolean>>({})
  const [autoPrefs, setAutoPrefs] = useState<QueueAutoReportPrefs>(() => loadQueueAutoReportPrefs())
  const [restorePreview, setRestorePreview] = useState<{ path: string; data: QueueRestorePreview } | null>(null)
  const filtered = useMemo(() => sortReportCatalog(filterReportCatalog(reports, query), sortBy), [reports, query, sortBy])
  const items = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const selectedList = useMemo(
    () => Object.entries(selectedPaths).filter(([, checked]) => checked).map(([path]) => path),
    [selectedPaths],
  )
  const bulkEnabled = !!(onDeleteReports || onPruneReports || onExportReportsZip)

  useEffect(() => {
    saveQueueAutoReportPrefs(autoPrefs)
  }, [autoPrefs])

  useEffect(() => {
    setSelectedPaths((prev) => {
      const valid = new Set(reports.map((item) => item.path))
      const next: Record<string, boolean> = {}
      for (const [path, checked] of Object.entries(prev)) {
        if (valid.has(path) && checked) next[path] = true
      }
      return next
    })
  }, [reports])

  const togglePath = (path: string, checked: boolean) => {
    setSelectedPaths((prev) => {
      const next = { ...prev }
      if (checked) next[path] = true
      else delete next[path]
      return next
    })
  }

  const toggleVisibleAll = (checked: boolean) => {
    setSelectedPaths((prev) => {
      const next = { ...prev }
      for (const report of items) {
        if (checked) next[report.path] = true
        else delete next[report.path]
      }
      return next
    })
  }

  const allVisibleSelected = items.length > 0 && items.every((report) => selectedPaths[report.path])

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">{t('report.catalog.title')}</div>
      <div className="settings-row-desc">{t('report.catalog.desc')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 12 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoPrefs.autoSaveOnComplete}
            onChange={(e) => setAutoPrefs((p) => ({ ...p, autoSaveOnComplete: e.target.checked }))}
          />
          {t('report.catalog.autoSave')}
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoPrefs.notifyOnComplete}
            onChange={(e) => setAutoPrefs((p) => ({ ...p, notifyOnComplete: e.target.checked }))}
          />
          {t('report.catalog.notify')}
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={query}
          placeholder={t('report.catalog.searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="settings-select"
          style={{ minWidth: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ReportCatalogSort)}
        >
          <option value="recent">{t('report.catalog.sort.recent')}</option>
          <option value="title">{t('report.catalog.sort.title')}</option>
        </select>
      </div>

      {bulkEnabled && filtered.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => toggleVisibleAll(e.target.checked)}
            />
            {t('report.catalog.selectAll')}
          </label>
          {onPruneReports ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('report.catalog.keepRecent')}</span>
              <input
                type="number"
                className="settings-input"
                style={{ width: 72 }}
                min={1}
                max={99}
                value={keepRecent}
                onChange={(e) => setKeepRecent(Math.max(1, Number(e.target.value) || 1))}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('report.catalog.keepUnit')}</span>
              <button type="button" className="btn btn-secondary" onClick={() => onPruneReports(keepRecent)}>
                {t('report.catalog.prune')}
              </button>
            </>
          ) : null}
          {onDeleteReports ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={selectedList.length === 0}
              onClick={() => onDeleteReports(selectedList)}
            >
              {t('report.catalog.deleteSelected')}
              {selectedList.length > 0 ? ` (${selectedList.length})` : ''}
            </button>
          ) : null}
          {onExportReportsZip ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={selectedList.length === 0}
              onClick={() => onExportReportsZip(selectedList)}
            >
              {t('report.catalog.exportZip')}
            </button>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('report.catalog.shownCount', { shown: items.length, filtered: filtered.length })}
            {reports.length !== filtered.length ? ` ${t('report.catalog.totalCount', { total: reports.length })}` : ''}
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
            {items.map((report) => (
              <div
                key={report.path}
                style={{ display: 'grid', gap: 6, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {bulkEnabled ? (
                    <input
                      type="checkbox"
                      checked={!!selectedPaths[report.path]}
                      onChange={(e) => togglePath(report.path, e.target.checked)}
                      aria-label={`选择 ${report.title}`}
                    />
                  ) : null}
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {report.title}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {report.path} · {formatGeneratedAt(report.generatedAt, t('report.catalog.timeUnknown'))}
                </div>
                {report.status || report.summary ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {report.status ? t('report.catalog.status', { status: report.status }) : ''}
                    {report.status && report.summary ? ' · ' : ''}
                    {report.summary ? t('report.catalog.summary', { summary: report.summary }) : ''}
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onOpenReport(report.path)}>
                    {t('report.catalog.open')}
                  </button>
                  {getRestorePreview && onRestoreReport ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          const data = getRestorePreview(report.path)
                          if (!data) {
                            setRestorePreview(null)
                            return
                          }
                          setRestorePreview({ path: report.path, data })
                        }}
                      >
                        {t('report.catalog.previewRestore')}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => onRestoreReport(report.path)}>
                        {t('report.catalog.restore')}
                      </button>
                    </>
                  ) : null}
                  {restorePreview?.path === report.path ? (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        padding: 8,
                        borderRadius: 8,
                        border: '1px dashed var(--border-color)',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                        {t('report.catalog.previewRestoreTitle')}
                      </div>
                      {formatQueueRestorePreview(restorePreview.data)}
                      {hasQueueRestoreItems(restorePreview.data) ? (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={() => {
                              if (onRestoreReport) onRestoreReport(report.path)
                            }}
                          >
                            {t('report.catalog.confirmRestore')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <button type="button" className="btn btn-secondary" onClick={() => onDeleteReport(report.path)}>
                    {t('report.catalog.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length < filtered.length ? (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + 8)}>
                {t('report.catalog.showMore')}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t('report.catalog.empty')}
        </div>
      )}
    </div>
  )
}
