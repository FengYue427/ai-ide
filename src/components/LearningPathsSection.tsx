import { memo } from 'react'
import { CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { LEARNING_PATHS } from '../lib/learningPaths'
import { useLearningPathProgress } from '../hooks/useLearningPathProgress'

interface LearningPathsSectionProps {
  onStartPath: (path: (typeof LEARNING_PATHS)[number]) => void
}

export const LearningPathsSection = memo(function LearningPathsSection({ onStartPath }: LearningPathsSectionProps) {
  const { t } = useI18n()
  const { getStatus } = useLearningPathProgress()

  return (
    <section className="learning-paths" data-testid="learning-paths">
      <div className="learning-paths__header">
        <Sparkles size={16} />
        <h2>{t('learningPath.sectionTitle')}</h2>
      </div>
      <p className="learning-paths__lead">{t('learningPath.sectionDesc')}</p>
      <div className="learning-paths__grid">
        {LEARNING_PATHS.map((path) => {
          const status = getStatus(path.id)
          return (
          <button
            key={path.id}
            type="button"
            className={`learning-paths__card learning-paths__card--${status}`}
            data-testid={`learning-path-${path.id}`}
            onClick={() => onStartPath(path)}
          >
            <strong>{t(path.titleKey)}</strong>
            <span>{t(path.descKey)}</span>
            <span className="learning-paths__meta">
              {status === 'completed' ? (
                <>
                  <CheckCircle2 size={12} />
                  {t('learningPath.statusCompleted')}
                </>
              ) : status === 'in_progress' ? (
                <>
                  <Sparkles size={12} />
                  {t('learningPath.statusInProgress')}
                </>
              ) : (
                <>
                  <Clock size={12} />
                  {t('learningPath.duration', { min: path.durationMin })}
                </>
              )}
            </span>
          </button>
        )})}
      </div>
    </section>
  )
})
