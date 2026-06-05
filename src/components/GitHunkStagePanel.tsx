import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { isGitHunkStageEnabled } from '../lib/v14Features'
import { loadWorkdirHunkPreview, stageWorkdirHunks, type WorkdirHunkPreview } from '../services/gitHunkStageService'
import type { DiffLine } from '../services/diffHunkService'
import styles from './GitPanel.module.css'

interface GitHunkStagePanelProps {
  fs: any
  filepath: string
  readOnly?: boolean
  disabled?: boolean
  onStaged?: () => void
  notify?: (kind: 'success' | 'error' | 'info', title: string, detail?: string) => void
}

function summarizeHunk(hunk: DiffLine[]): string {
  const added = hunk.filter((line) => line.type === 'added').length
  const removed = hunk.filter((line) => line.type === 'removed').length
  return `+${added} -${removed}`
}

export function GitHunkStagePanel({
  fs,
  filepath,
  readOnly = false,
  disabled = false,
  onStaged,
  notify,
}: GitHunkStagePanelProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<WorkdirHunkPreview | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [staging, setStaging] = useState(false)

  const enabled = isGitHunkStageEnabled()

  const loadPreview = useCallback(async () => {
    if (!fs || !enabled) return
    setLoading(true)
    try {
      const next = await loadWorkdirHunkPreview(fs, '/', filepath)
      setPreview(next)
      setSelected(new Set(next.hunks.map((_, index) => index)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      notify?.('error', t('git.hunkLoadFailed'), message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, fs, filepath, notify, t])

  useEffect(() => {
    if (!expanded) return
    void loadPreview()
  }, [expanded, loadPreview])

  if (!enabled) return null

  const toggleHunk = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleStageSelected = async () => {
    if (!fs || readOnly || disabled || selected.size === 0) return
    setStaging(true)
    try {
      await stageWorkdirHunks(fs, '/', filepath, selected)
      notify?.('success', t('git.hunkStaged'), filepath)
      onStaged?.()
      setExpanded(false)
      setPreview(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      notify?.('error', t('git.hunkStageFailed'), message)
    } finally {
      setStaging(false)
    }
  }

  return (
    <div className={styles.hunkPanel} data-testid={`git-hunk-panel-${filepath.replace(/[^\w.-]+/g, '_')}`}>
      <button
        type="button"
        className={styles.hunkToggle}
        onClick={() => setExpanded((value) => !value)}
        disabled={disabled}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {t('git.hunkStageTitle')}
      </button>

      {expanded ? (
        <div className={styles.hunkBody}>
          {loading ? <div className={styles.hunkHint}>{t('git.hunkLoading')}</div> : null}
          {!loading && preview && preview.hunks.length === 0 ? (
            <div className={styles.hunkHint}>{t('git.hunkEmpty')}</div>
          ) : null}
          {!loading && preview
            ? preview.hunks.map((hunk, index) => (
                <label key={index} className={styles.hunkRow}>
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    disabled={readOnly || disabled || staging}
                    onChange={() => toggleHunk(index)}
                  />
                  <span className={styles.hunkSummary}>
                    {t('git.hunkItem', { index: index + 1, summary: summarizeHunk(hunk) })}
                  </span>
                </label>
              ))
            : null}
          {!readOnly && preview && preview.hunks.length > 0 ? (
            <button
              type="button"
              className={`btn btn-secondary ${styles.hunkStageButton}`}
              disabled={disabled || staging || selected.size === 0}
              onClick={() => void handleStageSelected()}
              data-testid={`git-hunk-stage-${filepath.replace(/[^\w.-]+/g, '_')}`}
            >
              <Check size={12} />
              {staging ? t('git.hunkStaging') : t('git.hunkStageSelected')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
