import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, FileCode2, Play } from 'lucide-react'
import { ModalShell } from './ui/ModalShell'
import { useI18n } from '../i18n'
import {
  parseAcceptanceCriteria,
  setAcceptanceCriterionChecked,
} from '../services/intentOs/acceptanceEditorService'
import {
  verifyAcceptance,
  type AcceptanceVerifyResult,
} from '../services/runtime/acceptanceRunner'
import { formatAcceptanceVerifyFailures } from '../services/runtime/acceptanceVerifyMessages'
import { isDesktopApp } from '../services/desktopBridge'

export interface AcceptanceEditorModalProps {
  acceptancePath: string
  content: string
  onSave: (content: string) => void
  onOpenMarkdown: () => void
  onClose: () => void
}

export function AcceptanceEditorModal({
  acceptancePath,
  content,
  onSave,
  onOpenMarkdown,
  onClose,
}: AcceptanceEditorModalProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(content)
  const [verifyResult, setVerifyResult] = useState<AcceptanceVerifyResult | null>(null)

  const criteria = useMemo(() => parseAcceptanceCriteria(draft), [draft])
  const openCount = criteria.filter((item) => !item.checked).length

  const toggleCriterion = (lineIndex: number, checked: boolean) => {
    const next = setAcceptanceCriterionChecked(draft, lineIndex, checked)
    setDraft(next)
    onSave(next)
    setVerifyResult(null)
  }

  const runVerify = () => {
    const result = verifyAcceptance(draft, { isDesktop: isDesktopApp() })
    setVerifyResult(result)
  }

  return (
    <ModalShell
      className="modal--acceptance-editor"
      ariaLabel={t('acceptanceEditor.title')}
      title={
        <span className="modal-title-row">
          <ClipboardCheck size={18} />
          {t('acceptanceEditor.title')}
        </span>
      }
      onClose={onClose}
      footer={
        <div className="acceptance-editor-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="acceptance-editor-open-md"
            onClick={onOpenMarkdown}
          >
            <FileCode2 size={14} />
            {t('acceptanceEditor.openMarkdown')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="acceptance-editor-verify"
            onClick={runVerify}
          >
            <Play size={14} />
            {t('acceptanceEditor.runVerify')}
          </button>
        </div>
      }
    >
      <p className="acceptance-editor-path" data-testid="acceptance-editor-path">
        {acceptancePath}
      </p>
      <p className="acceptance-editor-lead">{t('acceptanceEditor.lead')}</p>

      {criteria.length === 0 ? (
        <p className="acceptance-editor-empty">{t('acceptanceEditor.noCriteria')}</p>
      ) : (
        <ul className="acceptance-editor-list" data-testid="acceptance-editor-list">
          {criteria.map((item) => (
            <li key={item.lineIndex} className="acceptance-editor-item">
              <label className="acceptance-editor-check">
                <input
                  type="checkbox"
                  checked={item.checked}
                  data-testid={`acceptance-criterion-${item.lineIndex}`}
                  onChange={(event) => toggleCriterion(item.lineIndex, event.target.checked)}
                />
                <span className={item.checked ? 'acceptance-editor-text--done' : undefined}>{item.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="acceptance-editor-meta">
        <span data-testid="acceptance-editor-open-count">
          {t('acceptanceEditor.openCount', { count: openCount })}
        </span>
        {!isDesktopApp() ? (
          <span className="acceptance-editor-hint">{t('acceptanceEditor.browserCommandHint')}</span>
        ) : null}
      </div>

      {verifyResult ? (
        <div
          className={`acceptance-editor-result acceptance-editor-result--${verifyResult.ok ? 'ok' : 'fail'}`}
          data-testid="acceptance-editor-result"
          role="status"
        >
          <CheckCircle2 size={16} />
          <div>
            <strong>
              {verifyResult.ok ? t('acceptanceEditor.verifyOk') : t('acceptanceEditor.verifyFail')}
            </strong>
            {!verifyResult.ok ? (
              <pre className="acceptance-editor-result-detail">{formatAcceptanceVerifyFailures(verifyResult)}</pre>
            ) : null}
          </div>
        </div>
      ) : null}
    </ModalShell>
  )
}

export default AcceptanceEditorModal
