import { useMemo, useState } from 'react'
import { Check, FileText } from 'lucide-react'
import { ModalShell } from './ui/ModalShell'
import { DiffViewer } from './DiffViewer'
import { applyChangesToFiles, applyChangesToWorkspace } from '../services/fileApplyService'
import { useI18n } from '../i18n'
import { useIDEStore, type AgentApplyItem } from '../store/ideStore'

export function AgentApplyModal() {
  const { t } = useI18n()
  const queue = useIDEStore((s) => s.agentApplyQueue)
  const selectedIndex = useIDEStore((s) => s.agentApplyIndex)
  const setAgentApplyIndex = useIDEStore((s) => s.setAgentApplyIndex)
  const setAgentApplyQueue = useIDEStore((s) => s.setAgentApplyQueue)
  const setShowAgentApplyModal = useIDEStore((s) => s.setShowAgentApplyModal)
  const setFiles = useIDEStore((s) => s.setFiles)
  const setActiveFile = useIDEStore((s) => s.setActiveFile)

  const [appliedPaths, setAppliedPaths] = useState<Set<string>>(new Set())

  const selected = queue?.[selectedIndex] ?? null

  const close = () => {
    setShowAgentApplyModal(false)
    setAgentApplyQueue(null)
    setAppliedPaths(new Set())
  }

  const applyItems = (items: AgentApplyItem[]) => {
    const payload = items.map((item) => ({
      path: item.path,
      content: item.newContent,
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
    void applyChangesToWorkspace(payload)
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
    applyItems(queue)
    close()
  }

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
              onApplyPartial={(mergedContent) => {
                if (!selected) return
                applyItems([{ ...selected, newContent: mergedContent }])
              }}
              onApply={applyCurrent}
              applyLabel={t('diff.apply')}
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
          <button type="button" className="btn-secondary" onClick={applyCurrent} disabled={!selected}>
            {t('agentApply.applyCurrent')}
          </button>
          <button type="button" className="btn-primary" onClick={applyAll}>
            {t('agentApply.applyAll', { count: queue.length })}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
