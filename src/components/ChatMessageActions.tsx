import { Copy, FileInput, RefreshCw, SkipForward } from 'lucide-react'
import { useI18n } from '../i18n'

type ChatMessageActionsProps = {
  role: 'user' | 'assistant'
  canRetry: boolean
  canContinue: boolean
  canPromote?: boolean
  onCopy: () => void
  onRetry?: () => void
  onContinue?: () => void
  onPromote?: () => void
}

export function ChatMessageActions({
  role,
  canRetry,
  canContinue,
  canPromote = false,
  onCopy,
  onRetry,
  onContinue,
  onPromote,
}: ChatMessageActionsProps) {
  const { t } = useI18n()

  return (
    <div className={`chat-msg-actions chat-msg-actions--${role}`}>
      <button type="button" className="chat-msg-actions__btn" onClick={onCopy} title={t('chat.action.copy')}>
        <Copy size={12} />
        <span>{t('chat.action.copy')}</span>
      </button>
      {canPromote && onPromote ? (
        <button type="button" className="chat-msg-actions__btn" onClick={onPromote} title={t('intent.promote.action')}>
          <FileInput size={12} />
          <span>{t('intent.promote.action')}</span>
        </button>
      ) : null}
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
