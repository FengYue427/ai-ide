import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckSquare, Coffee, Cpu, FileCode2, GitBranch, Link2, Sparkles, Terminal } from 'lucide-react'
import {
  listSpecStudioTemplates,
  detectRecommendedSpecTemplate,
  createSpecStudioBundle,
  buildSpecStudioRefinePrompt,
  type SpecStudioStack,
  type SpecStudioTemplateId,
} from '../services/specStudioService'
import { useI18n, type Language, type TranslationKey } from '../i18n'
import { ModalShell } from './ui/ModalShell'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'

const STACK_FILTERS: Array<'all' | SpecStudioStack> = [
  'all',
  'node',
  'java',
  'cpp',
  'go',
  'rust',
  'python',
  'git',
  'ai',
  'general',
]

const STACK_ICON: Record<SpecStudioStack, typeof FileCode2> = {
  node: FileCode2,
  java: Coffee,
  cpp: Cpu,
  go: Terminal,
  rust: Cpu,
  python: FileCode2,
  git: GitBranch,
  ai: Bot,
  general: Sparkles,
}

export interface SpecStudioPanelProps {
  files: FileItem[]
  onClose: () => void
  onApplySpec: (result: ReturnType<typeof createSpecStudioBundle>) => void
  onRefineWithAi: (prompt: string) => void
  onExecuteFirstTask: (tasksPath: string) => void
  onCreateLinkedPlan?: (ctx: { specSlug: string; tasksPath: string }) => void
}

export function SpecStudioPanel({
  files,
  onClose,
  onApplySpec,
  onRefineWithAi,
  onExecuteFirstTask,
  onCreateLinkedPlan,
}: SpecStudioPanelProps) {
  const { t, locale } = useI18n()
  const lang = locale as Language
  const specStudioPrefill = useIDEStore((s) => s.specStudioPrefill)
  const setSpecStudioPrefill = useIDEStore((s) => s.setSpecStudioPrefill)
  const recommended = useMemo(
    () => detectRecommendedSpecTemplate(files.map((file) => file.name)),
    [files],
  )
  const [specName, setSpecName] = useState('')
  const [userGoal, setUserGoal] = useState('')
  const [stackFilter, setStackFilter] = useState<'all' | SpecStudioStack>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<SpecStudioTemplateId>(recommended)
  const [lastCreated, setLastCreated] = useState<{ tasksPath: string; templateId: SpecStudioTemplateId; specSlug: string } | null>(
    null,
  )

  useEffect(() => {
    if (!specStudioPrefill) return
    if (specStudioPrefill.specName) setSpecName(specStudioPrefill.specName)
    if (specStudioPrefill.templateId) {
      setSelectedTemplateId(specStudioPrefill.templateId as SpecStudioTemplateId)
    }
    setSpecStudioPrefill(null)
  }, [specStudioPrefill, setSpecStudioPrefill])

  const templates = useMemo(() => {
    const all = listSpecStudioTemplates()
    if (stackFilter === 'all') return all
    return all.filter((item) => item.stack === stackFilter)
  }, [stackFilter])

  const handleCreate = () => {
    const name = specName.trim()
    if (!name) return
    const bundle = createSpecStudioBundle(selectedTemplateId, name, lang)
    onApplySpec(bundle)
    setLastCreated({
      tasksPath: bundle.tasksPath,
      templateId: selectedTemplateId,
      specSlug: bundle.specSlug,
    })
  }

  const handleRefine = () => {
    const ctx = lastCreated ?? {
      tasksPath: '',
      templateId: selectedTemplateId,
      specSlug: specName.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').toLowerCase() || 'new-spec',
    }
    if (!lastCreated && !specName.trim()) return
    const prompt = buildSpecStudioRefinePrompt(ctx.templateId, ctx.specSlug, userGoal, lang)
    onRefineWithAi(prompt)
  }

  const handleExecute = () => {
    if (!lastCreated?.tasksPath) return
    onExecuteFirstTask(lastCreated.tasksPath)
  }

  const handleCreateLinkedPlan = () => {
    if (!lastCreated?.tasksPath || !onCreateLinkedPlan) return
    onCreateLinkedPlan({ specSlug: lastCreated.specSlug, tasksPath: lastCreated.tasksPath })
  }

  return (
    <ModalShell
      className="modal--spec-studio"
      ariaLabel={t('specStudio.title')}
      title={
        <span className="modal-title-row">
          <Sparkles size={18} />
          {t('specStudio.title')}
        </span>
      }
      onClose={onClose}
      footer={
        <div className="spec-studio-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="spec-studio-refine"
            disabled={!specName.trim() && !lastCreated}
            onClick={handleRefine}
          >
            <Bot size={14} />
            {t('specStudio.refineWithAi')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="spec-studio-execute"
            disabled={!lastCreated?.tasksPath}
            onClick={handleExecute}
          >
            <CheckSquare size={14} />
            {t('specStudio.executeFirst')}
          </button>
          {onCreateLinkedPlan ? (
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="spec-studio-link-plan"
              disabled={!lastCreated?.tasksPath}
              onClick={handleCreateLinkedPlan}
            >
              <Link2 size={14} />
              {t('specStudio.createLinkedPlan')}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            data-testid="spec-studio-create"
            disabled={!specName.trim()}
            onClick={handleCreate}
          >
            {t('specStudio.create')}
          </button>
        </div>
      }
    >
      <p className="spec-studio-lead">{t('specStudio.lead')}</p>

      <div className="spec-studio-fields">
        <label className="spec-studio-label">
          {t('specStudio.nameLabel')}
          <input
            type="text"
            className="settings-input"
            value={specName}
            placeholder={t('spec.catalog.namePlaceholder')}
            onChange={(e) => setSpecName(e.target.value)}
          />
        </label>
        <label className="spec-studio-label">
          {t('specStudio.goalLabel')}
          <textarea
            className="settings-input spec-studio-goal"
            rows={2}
            value={userGoal}
            placeholder={t('specStudio.goalPlaceholder')}
            onChange={(e) => setUserGoal(e.target.value)}
          />
        </label>
      </div>

      <div className="spec-studio-filters" role="tablist" aria-label={t('specStudio.filterStacks')}>
        {STACK_FILTERS.map((stack) => (
          <button
            key={stack}
            type="button"
            role="tab"
            aria-selected={stackFilter === stack}
            className={`spec-studio-filter${stackFilter === stack ? ' spec-studio-filter--active' : ''}`}
            onClick={() => setStackFilter(stack)}
          >
            {stack === 'all' ? t('specStudio.filterAll') : t(`specStudio.stack.${stack}` as TranslationKey)}
          </button>
        ))}
      </div>

      <div className="template-grid spec-studio-grid">
        {templates.map((template) => {
          const Icon = STACK_ICON[template.stack]
          const isRecommended = template.id === recommended
          const isSelected = template.id === selectedTemplateId
          return (
            <button
              key={template.id}
              type="button"
              data-testid={`spec-studio-template-${template.id}`}
              className={`template-card spec-studio-card${isSelected ? ' spec-studio-card--selected' : ''}`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <span className="template-card__icon">
                <Icon size={22} />
              </span>
              <span className="template-card__name">
                {t(template.titleKey as TranslationKey)}
                {isRecommended ? (
                  <span className="spec-studio-badge">{t('specStudio.recommended')}</span>
                ) : null}
              </span>
              <span className="template-card__desc">{t(template.descKey as TranslationKey)}</span>
              <span className="template-card__meta">{template.tags.join(' · ')}</span>
            </button>
          )
        })}
      </div>

      {lastCreated ? (
        <p className="spec-studio-created" data-testid="spec-studio-created-hint">
          {t('specStudio.createdHint', { path: lastCreated.tasksPath })}
        </p>
      ) : null}
    </ModalShell>
  )
}

export default SpecStudioPanel
