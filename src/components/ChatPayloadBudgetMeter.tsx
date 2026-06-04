import { useI18n } from '../i18n'
import { toKb, type PayloadBudgetLevel } from '../services/payloadBudget'

interface ChatPayloadBudgetMeterProps {
  estimatedBytes: number
  budgetBytes: number
  usagePercent: number
  level: PayloadBudgetLevel
  footnote?: string
}

export function ChatPayloadBudgetMeter({
  estimatedBytes,
  budgetBytes,
  usagePercent,
  level,
  footnote,
}: ChatPayloadBudgetMeterProps) {
  const { t } = useI18n()

  return (
    <div
      className={`chat-payload-meter chat-payload-meter--${level}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={usagePercent}
      aria-label={t('chat.payload.meterAria', {
        estimatedKb: toKb(estimatedBytes),
        budgetKb: toKb(budgetBytes),
        percent: usagePercent,
      })}
    >
      <div className="chat-payload-meter__track">
        <div className="chat-payload-meter__fill" style={{ width: `${Math.min(100, usagePercent)}%` }} />
      </div>
      <span className="chat-payload-meter__label">
        {t('chat.payload.meterLabel', {
          estimatedKb: toKb(estimatedBytes),
          budgetKb: toKb(budgetBytes),
          percent: usagePercent,
        })}
      </span>
      {footnote ? <span className="chat-payload-meter__footnote">{footnote}</span> : null}
    </div>
  )
}
