import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'

export function PluginModal() {
  const { t } = useI18n()
  const pluginModal = useIDEStore((s) => s.pluginModal)
  const setPluginModal = useIDEStore((s) => s.setPluginModal)

  if (!pluginModal) return null

  return (
    <div className="modal-overlay" onClick={() => setPluginModal(null)}>
      <div
        className="modal"
        style={{ width: '420px', maxWidth: '92vw' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">{pluginModal.title}</span>
          <button type="button" className="modal-close" onClick={() => setPluginModal(null)} aria-label={t('plugin.close')}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {pluginModal.body}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={() => setPluginModal(null)}>
            {t('plugin.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
