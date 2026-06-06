import { useEffect, useMemo, useState } from 'react'
import { Check, FileText } from 'lucide-react'
import { ModalShell } from './ui/ModalShell'
import { DiffViewer } from './DiffViewer'
import { applyChangesToFiles, applyChangesWithResult } from '../services/fileApplyService'
import { publishAgentFileWrite } from '../services/runtime/runtimeActivityPublishers'
import { onAgentFilesApplied } from '../services/runtime/runtimeQueueCoordinator'
import type { ToastKind } from './FeedbackCenter'
import {
  acceptedHunkSummary,
  initHunkSelections,
  resolveApplyContent,
  type HunkSelectionMap,
} from '../services/agentApplyHunks'
import { computeLineDiff, defaultAcceptedHunks } from '../services/diffHunkService'
import { useI18n } from '../i18n'
import { useIDEStore, type AgentApplyItem } from '../store/ideStore'

interface AgentApplyModalProps {
  notify?: (kind: ToastKind, title: string, detail?: string) => void
}

export function AgentApplyModal({ notify }: AgentApplyModalProps) {
  const { t } = useI18n()
  const queue = useIDEStore((s) => s.agentApplyQueue)
  const selectedIndex = useIDEStore((s) => s.agentApplyIndex)
  const setAgentApplyIndex = useIDEStore((s) => s.setAgentApplyIndex)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)
  const queuedSpecBackfill = useIDEStore((s) => s.queuedSpecBackfill)

  const [appliedPaths, setAppliedPaths] = useState<Set<string>>(new Set())
  const [hunkSelections, setHunkSelections] = useState<HunkSelectionMap>(() =>
    queue ? initHunkSelections(queue) : new Map(),
  )

  const selected = queue?.[selectedIndex] ?? null

  useEffect(() => {
    if (!queue?.length) return
    setHunkSelections((prev) => {
      const next = new Map(prev)
      for (const item of queue) {
        if (!item.oldContent || next.has(item.path)) continue
        next.set(item.path, defaultAcceptedHunks(computeLineDiff(item.oldContent, item.newContent)))
      }
      return next
    })
  }, [queue])

  const close = () => {
    setShowAgentApplyModal(false)
    setAgentApplyQueue(null)
    setAppliedPaths(new Set())
    setHunkSelections(new Map())
  }

  const applyItems = (items: AgentApplyItem[]) => {
    const payload = items.map((item) => ({
      path: item.path,
      content: resolveApplyContent(item, hunkSelections),
      language: item.language,
    }))

    setFiles((prev) => {
      const next = applyChangesToFiles(prev, payload)
      const last = items[items.length - 1]
      if (last) {
        const path = last.path.replace(/^\.\//, '')
        const idx = next.findIndex((f) => f.name === path || f.name.endsWith(`/${path}`))
        if (idx >= 0) queueMicrotask(() => setActiveFile(idx))
      }
      return next
    })
    void applyChangesWithResult(payload).then((result) => {
      if (result.failures.length === 0) {
        items.forEach((item) => publishAgentFileWrite(item.path))
        void onAgentFilesApplied(
          payload.map((row) => row.path),
          {
            getFiles: () => useIDEStore.getState().files,
            setFiles,
          },
          queuedSpecBackfill?.taskPath,
        )
        return
      }
      const paths = result.failures.map((row) => row.path).join(', ')
      const reason = result.failures[0]?.reason ?? t('agentApply.failReason.unknown')
      notify?.(
        'error',
        t('agentApply.failTitle'),
        t('agentApply.failDetail', {
          applied: String(result.applied),
          total: String(payload.length),
          paths,
          reason,
        }),
      )
    })
    setAppliedPaths((prev) => {
      const next = new Set(prev)
      items.forEach((item) => next.add(item.path))
      return next
    })
  }

  const applyCurrent = () => {
    if (!selected) return
    applyItems([selected])
    if (queue?.length === 1) close()
  }

  const applyAll = () => {
    if (!queue?.length) return
    const pending = queue.filter((item) => !appliedPaths.has(item.path))
    applyItems(pending.length > 0 ? pending : queue)
    close()
  }

  const skipCurrent = () => {
    if (!queue || !selected) return
    setAppliedPaths((prev) => new Set(prev).add(selected.path))
    const nextQueue = queue.filter((item) => item.path !== selected.path)
    if (nextQueue.length === 0) {
      close()
      return
    }
    setAgentApplyQueue(nextQueue)
    setAgentApplyIndex(Math.min(selectedIndex, nextQueue.length - 1))
  }

  const setAcceptedForSelected = (next: Set<number>) => {
    if (!selected) return
    setHunkSelections((prev) => {
      const map = new Map(prev)
      map.set(selected.path, next)
      return map
    })
  }

  const selectedAcceptedHunks = useMemo(() => {
    if (!selected?.oldContent) return undefined
    return (
      hunkSelections.get(selected.path) ??
      defaultAcceptedHunks(computeLineDiff(selected.oldContent, selected.newContent))
    )
  }, [selected, hunkSelections])

  const remainingCount = useMemo(() => {
    if (!queue) return 0
    return queue.filter((item) => !appliedPaths.has(item.path)).length
  }, [queue, appliedPaths])

  if (!queue?.length) return null

  return (
    <ModalShell
      title={t('agentApply.title')}
      onClose={close}
      className="agent-apply-modal"
      bodyClassName="agent-apply-body"
      ariaLabel={t('agentApply.title')}
    >
      <div className="agent-apply-layout">
        <aside className="agent-apply-files">
          {queue.map((item, index) => {
            const isNew = !item.oldContent
            const isApplied = appliedPaths.has(item.path)
            const hunkMeta = acceptedHunkSummary(item, hunkSelections)
            return (
              <button
                key={item.path}
                type="button"
                className={`agent-apply-file ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => setAgentApplyIndex(index)}
              >
                <FileText size={14} />
                <span className="agent-apply-file-name">{item.path}</span>
                <span className="agent-apply-file-badge">{isNew ? t('agentApply.badge.new') : t('agentApply.badge.modified')}</span>
                {!isNew && hunkMeta.total > 0 ? (
                  <span className="agent-apply-file-hunks">
                    {t('agentApply.hunkBadge', { accepted: hunkMeta.accepted, total: hunkMeta.total })}
                  </span>
                ) : null}
                {isApplied ? <Check size={12} className="agent-apply-file-done" /> : null}
              </button>
            )
          })}
        </aside>

        <div className="agent-apply-diff">
          {selected ? (
            <DiffViewer
              embedded
              oldContent={selected.oldContent}
              newContent={selected.newContent}
              oldLabel={t('agentApply.oldLabel')}
              newLabel={t('agentApply.newLabel')}
              onClose={close}
              enablePartialApply={Boolean(selected.oldContent)}
              acceptedHunks={selectedAcceptedHunks}
              onAcceptedHunksChange={setAcceptedForSelected}
              onApplyPartial={() => applyCurrent()}
              partialApplyLabel={t('agentApply.applyCurrentHunks')}
              onApply={applyCurrent}
              applyLabel={t('agentApply.applyCurrentFull')}
            />
          ) : (
            <div className="agent-apply-empty">{t('agentApply.empty')}</div>
          )}
        </div>
      </div>

      <div className="agent-apply-footer">
        <span className="agent-apply-footer-meta">
          {t('agentApply.footer', { total: queue.length, remaining: remainingCount })}
        </span>
        <div className="agent-apply-footer-actions">
          <button type="button" className="btn-secondary" onClick={close}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-secondary" onClick={skipCurrent} disabled={!selected}>
            {t('agentApply.skipCurrent')}
          </button>
          <button type="button" className="btn-secondary" onClick={applyCurrent} disabled={!selected}>
            {t('agentApply.applyCurrentHunks')}
          </button>
          <button type="button" className="btn-primary" onClick={applyAll}>
            {t('agentApply.applyAll', { count: remainingCount || queue.length })}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
