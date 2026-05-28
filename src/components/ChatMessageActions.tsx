import { Copy, RefreshCw, SkipForward } from 'lucide-react'
import { useI18n } from '../i18n'

type ChatMessageActionsProps = {
  role: 'user' | 'assistant'
  canRetry: boolean
  canContinue: boolean
  onCopy: () => void
  onRetry?: () => void
  onContinue?: () => void
}

export function ChatMessageActions({
  role,
  canRetry,
  canContinue,
  onCopy,
  onRetry,
  onContinue,
}: ChatMessageActionsProps) {
  const { t } = useI18n()

  return (
    <div className={`chat-msg-actions chat-msg-actions--${role}`}>
      <button type="button" className="chat-msg-actions__btn" onClick={onCopy} title={t('chat.action.copy')}>
        <Copy size={12} />
        <span>{t('chat.action.copy')}</span>
      </button>
      {canRetry && onRetry ? (
        <button type="button" className="chat-msg-actions__btn" onClick={onRetry} title={t('chat.action.retry')}>
          <RefreshCw size={12} />
          <span>{t('chat.action.retry')}</span>
        </button>
      ) : null}
      {canContinue && onContinue ? (
        <button type="button" className="chat-msg-actions__btn" onClick={onContinue} title={t('chat.action.continue')}>
          <SkipForward size={12} />
          <span>{t('chat.action.continue')}</span>
        </button>
      ) : null}
    </div>
  )
}
