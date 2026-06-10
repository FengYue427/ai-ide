import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '../../i18n'

export interface ChatQuickAction {
  icon: LucideIcon
  label: string
  action: () => void
}

export interface ChatQuickActionsBarProps {
  actions: ChatQuickAction[]
  planMode: boolean
  actionsDisabled: boolean
  planDisabled: boolean
  onRunFirstPlanStep: () => void
}

export const ChatQuickActionsBar = memo(function ChatQuickActionsBar({
  actions,
  planMode,
  actionsDisabled,
  planDisabled,
  onRunFirstPlanStep,
}: ChatQuickActionsBarProps) {
  const { t } = useI18n()

  return (
    <div className="chat-quick-actions">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="chat-quick-btn"
          onClick={action.action}
          disabled={actionsDisabled}
        >
          <action.icon size={14} />
          {action.label}
        </button>
      ))}
      {planMode ? (
        <button
          type="button"
          className="chat-quick-btn"
          onClick={onRunFirstPlanStep}
          disabled={planDisabled}
          title={t('chat.plan.runFirstStepTitle')}
        >
          {t('chat.plan.runFirstStep')}
        </button>
      ) : null}
    </div>
  )
})
