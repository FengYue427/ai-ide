import { useState } from 'react'
import { FileInput } from 'lucide-react'
import { useI18n } from '../i18n'
import { ModalShell } from './ui/ModalShell'

export interface PromoteToSpecModalProps {
  defaultSpecName: string
  onClose: () => void
  onConfirm: (options: { specName: string; runFirstTask: boolean; openStudio: boolean }) => void
}

export function PromoteToSpecModal({ defaultSpecName, onClose, onConfirm }: PromoteToSpecModalProps) {
  const { t } = useI18n()
  const [specName, setSpecName] = useState(defaultSpecName)
  const [runFirstTask, setRunFirstTask] = useState(true)
  const [openStudio, setOpenStudio] = useState(false)

  return (
    <ModalShell
      className="modal--promote-spec"
      ariaLabel={t('intent.promote.modalTitle')}
      title={
        <span className="modal-title-row">
          <FileInput size={18} />
          {t('intent.promote.modalTitle')}
        </span>
      }
      onClose={onClose}
      footer={
        <div className="promote-spec-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="promote-spec-confirm"
            disabled={!specName.trim()}
            onClick={() =>
              onConfirm({
                specName: specName.trim(),
                runFirstTask,
                openStudio,
              })
            }
          >
            {t('intent.promote.confirm')}
          </button>
        </div>
      }
    >
      <p className="promote-spec-lead">{t('intent.promote.modalLead')}</p>
      <label className="spec-studio-label">
        {t('specStudio.nameLabel')}
        <input
          type="text"
          className="settings-input"
          value={specName}
          onChange={(e) => setSpecName(e.target.value)}
          data-testid="promote-spec-name"
        />
      </label>
      <label className="promote-spec-check">
        <input type="checkbox" checked={runFirstTask} onChange={(e) => setRunFirstTask(e.target.checked)} />
        <span>{t('intent.promote.runFirstTask')}</span>
      </label>
      <label className="promote-spec-check">
        <input type="checkbox" checked={openStudio} onChange={(e) => setOpenStudio(e.target.checked)} />
        <span>{t('intent.promote.openStudio')}</span>
      </label>
    </ModalShell>
  )
}
