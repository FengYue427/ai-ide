import { memo, useCallback, useMemo, useState } from 'react'
import { BarChart3, Copy, Download } from 'lucide-react'
import { useI18n } from '../i18n'
import { buildWeeklyRecap, formatWeeklyRecapMarkdown } from '../lib/weeklyRecapService'
import { LEARNING_PATHS } from '../lib/learningPaths'
import { canUseEntitlement } from '../lib/planFeatureGate'
import { useIDEStore } from '../store/ideStore'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { ModalShell } from './ui/ModalShell'

interface WeeklyRecapModalProps {
  onClose: () => void
}

export const WeeklyRecapModal = memo(function WeeklyRecapModal({ onClose }: WeeklyRecapModalProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const recap = buildWeeklyRecap(files)
  const [copied, setCopied] = useState(false)
  const canExport = canUseEntitlement('weeklyRecapExport')

  const markdown = useMemo(
    () =>
      formatWeeklyRecapMarkdown(recap, {
        title: t('weeklyRecap.title'),
        doneTasks: t('weeklyRecap.doneTasks'),
        openTasks: t('weeklyRecap.openTasks'),
        proofReports: t('weeklyRecap.proofReports'),
        specs: t('weeklyRecap.specs'),
        recentProofs: t('weeklyRecap.recentProofs'),
        learningPathsCompleted: t('weeklyRecap.learningPathsCompleted'),
        learningPathsInProgress: t('weeklyRecap.learningPathsInProgress'),
        empty: t('weeklyRecap.empty'),
      }),
    [recap, t],
  )

  const handleCopy = useCallback(async () => {
    if (!canExport) {
      setShowSubscriptionModal(true)
      return
    }
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }, [canExport, markdown, setShowSubscriptionModal])

  const handleDownload = useCallback(() => {
    if (!canExport) {
      setShowSubscriptionModal(true)
      return
    }
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `aide-weekly-recap-${Date.now()}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [canExport, markdown, setShowSubscriptionModal])

  return (
    <ModalShell title={t('weeklyRecap.title')} onClose={onClose} className="weekly-recap-modal">
      {!canExport ? (
        <UpgradeEntitlementHint
          messageKey="entitlements.upgrade.weeklyRecap"
          onUpgrade={() => setShowSubscriptionModal(true)}
        />
      ) : null}
      <div className="weekly-recap-modal__actions">
        <button type="button" className="btn btn-secondary" onClick={() => void handleCopy()}>
          <Copy size={14} />
          {copied ? t('collab.copied') : t('weeklyRecap.copyMarkdown')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleDownload}>
          <Download size={14} />
          {t('weeklyRecap.export')}
        </button>
      </div>
      <div className="weekly-recap-modal__grid">
        <div className="weekly-recap-modal__stat">
          <span className="weekly-recap-modal__value">{recap.doneTaskCount}</span>
          <span className="weekly-recap-modal__label">{t('weeklyRecap.doneTasks')}</span>
        </div>
        <div className="weekly-recap-modal__stat">
          <span className="weekly-recap-modal__value">{recap.openTaskCount}</span>
          <span className="weekly-recap-modal__label">{t('weeklyRecap.openTasks')}</span>
        </div>
        <div className="weekly-recap-modal__stat">
          <span className="weekly-recap-modal__value">{recap.proofReportCount}</span>
          <span className="weekly-recap-modal__label">{t('weeklyRecap.proofReports')}</span>
        </div>
        <div className="weekly-recap-modal__stat">
          <span className="weekly-recap-modal__value">{recap.specCount}</span>
          <span className="weekly-recap-modal__label">{t('weeklyRecap.specs')}</span>
        </div>
      </div>
      {recap.recentProofPaths.length > 0 ? (
        <div className="weekly-recap-modal__proofs">
          <div className="weekly-recap-modal__section-title">
            <BarChart3 size={14} />
            {t('weeklyRecap.recentProofs')}
          </div>
          <ul>
            {recap.recentProofPaths.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="weekly-recap-modal__empty">{t('weeklyRecap.empty')}</p>
      )}
      {recap.learningPathCompleted.length > 0 || recap.learningPathInProgress.length > 0 ? (
        <div className="weekly-recap-modal__paths">
          {recap.learningPathInProgress.map((id) => {
            const path = LEARNING_PATHS.find((item) => item.id === id)
            return path ? <div key={id}>{t(path.titleKey)} · {t('learningPath.statusInProgress')}</div> : null
          })}
          {recap.learningPathCompleted.map((id) => {
            const path = LEARNING_PATHS.find((item) => item.id === id)
            return path ? <div key={id}>{t(path.titleKey)} · {t('learningPath.statusCompleted')}</div> : null
          })}
        </div>
      ) : null}
    </ModalShell>
  )
})
