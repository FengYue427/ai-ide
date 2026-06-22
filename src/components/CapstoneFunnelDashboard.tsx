import { memo } from 'react'
import { GraduationCap } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  CAPSTONE_FUNNEL_METRIC_ORDER,
  readCapstoneFunnelMetrics,
  summarizeCapstoneFunnelMetrics,
  type CapstoneFunnelMetricStep,
} from '../lib/capstoneFunnelMetrics'

const STEP_LABEL_KEYS: Record<CapstoneFunnelMetricStep, string> = {
  welcome_click: 'capstone.funnel.metric.welcome',
  created: 'capstone.funnel.metric.created',
  auto_launch: 'capstone.funnel.metric.autoLaunch',
  'review-spec': 'capstone.funnel.metric.review',
  'run-tasks': 'capstone.funnel.metric.runTasks',
  'check-acceptance': 'capstone.funnel.metric.acceptance',
  completed: 'capstone.funnel.metric.completed',
}

interface CapstoneFunnelDashboardProps {
  onResume?: () => void
}

export const CapstoneFunnelDashboard = memo(function CapstoneFunnelDashboard({
  onResume,
}: CapstoneFunnelDashboardProps) {
  const { t } = useI18n()
  const metrics = readCapstoneFunnelMetrics()
  const summary = summarizeCapstoneFunnelMetrics(metrics)

  if (!metrics || summary.completed === 0) return null

  return (
    <section className="capstone-funnel-dashboard" data-testid="capstone-funnel-dashboard">
      <div className="capstone-funnel-dashboard__header">
        <GraduationCap size={18} aria-hidden />
        <div>
          <strong>{t('capstone.funnel.dashboard.title')}</strong>
          <span>{t('capstone.funnel.dashboard.subtitle', { slug: metrics.specSlug, percent: summary.percent })}</span>
        </div>
      </div>
      <div
        className="capstone-funnel-dashboard__bar"
        role="progressbar"
        aria-valuenow={summary.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${summary.percent}%` }} />
      </div>
      <ol className="capstone-funnel-dashboard__steps">
        {CAPSTONE_FUNNEL_METRIC_ORDER.map((step) => {
          const done = Boolean(metrics.steps[step])
          return (
            <li
              key={step}
              className={done ? 'capstone-funnel-dashboard__step--done' : undefined}
              data-testid={`capstone-funnel-metric-${step}`}
            >
              {t(STEP_LABEL_KEYS[step] as never)}
            </li>
          )
        })}
      </ol>
      {onResume ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onResume}>
          {t('capstone.funnel.dashboard.resume')}
        </button>
      ) : null}
    </section>
  )
})
