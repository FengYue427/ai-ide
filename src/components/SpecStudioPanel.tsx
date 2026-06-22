import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CheckSquare, ChevronLeft, ChevronRight, Coffee, Cpu, FileCode2, GitBranch, Link2, Sparkles, Terminal } from 'lucide-react'
import {
  listSpecStudioTemplates,
  detectRecommendedSpecTemplate,
  buildSpecStudioRefinePrompt,
  type SpecStudioStack,
  type SpecStudioTemplateId,
} from '../services/specStudioService'
import {
  assembleFormalizationBundle,
  buildFormalizationPreviewFiles,
  bundleDocContents,
  FORMALIZATION_STEP_ORDER,
  summarizeFormalizationPreview,
  type BundleDocKey,
  type FormalizationStep,
} from '../services/intentOs/intentFormalizationService'
import { useI18n, type Language, type TranslationKey } from '../i18n'
import { ModalShell } from './ui/ModalShell'
import { useIDEStore } from '../store/ideStore'
import type { FileItem } from '../types/file'
import { startCapstoneFunnel } from '../lib/capstoneFunnel'
import { trackCapstoneFunnelStep } from '../lib/conversionTracking'

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

const PREVIEW_TABS: BundleDocKey[] = ['requirements', 'design', 'tasks', 'acceptance']

export interface SpecStudioPanelProps {
  files: FileItem[]
  onClose: () => void
  onApplySpec: (result: ReturnType<typeof assembleFormalizationBundle>, templateId: SpecStudioTemplateId) => void
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
  const [wizardStep, setWizardStep] = useState<FormalizationStep>('intent')
  const [specName, setSpecName] = useState('')
  const [userGoal, setUserGoal] = useState('')
  const [stackFilter, setStackFilter] = useState<'all' | SpecStudioStack>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<SpecStudioTemplateId>(recommended)
  const [previewTab, setPreviewTab] = useState<BundleDocKey>('requirements')
  const [docEdits, setDocEdits] = useState<Partial<Record<BundleDocKey, string>>>({})
  const [lastCreated, setLastCreated] = useState<{ tasksPath: string; templateId: SpecStudioTemplateId; specSlug: string } | null>(
    null,
  )
  const [showNameHint, setShowNameHint] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const nameMissing = !specName.trim()

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

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

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? listSpecStudioTemplates()[0],
    [selectedTemplateId, templates],
  )

  const previewFiles = useMemo(() => {
    if (!specName.trim()) return []
    return buildFormalizationPreviewFiles(selectedTemplateId, specName, userGoal, lang)
  }, [lang, selectedTemplateId, specName, userGoal])

  const previewSummary = useMemo(() => {
    if (previewFiles.length === 0) return null
    const slug =
      previewFiles.find((file) => file.path.endsWith('/tasks.md'))?.path.replace(/^\.aide\/specs\//, '').replace(/\/tasks\.md$/, '') ??
      'new-spec'
    return summarizeFormalizationPreview(previewFiles, selectedTemplateId, slug)
  }, [previewFiles, selectedTemplateId])

  const activeDocContent = useMemo(() => {
    const base = bundleDocContents(previewFiles)
    return docEdits[previewTab] ?? base[previewTab] ?? ''
  }, [docEdits, previewFiles, previewTab])

  const goNext = () => {
    if (wizardStep === 'intent') {
      if (nameMissing) {
        setShowNameHint(true)
        nameInputRef.current?.focus()
        return
      }
      setShowNameHint(false)
      setWizardStep('template')
      return
    }
    if (wizardStep === 'template') {
      setDocEdits({})
      setPreviewTab('requirements')
      setWizardStep('preview')
    }
  }

  const goBack = () => {
    if (wizardStep === 'template') setWizardStep('intent')
    if (wizardStep === 'preview') setWizardStep('template')
  }

  const handleCreate = () => {
    const name = specName.trim()
    if (!name) {
      setShowNameHint(true)
      nameInputRef.current?.focus()
      return
    }
    setShowNameHint(false)
    const bundle = assembleFormalizationBundle(selectedTemplateId, name, userGoal, lang, docEdits)
    onApplySpec(bundle, selectedTemplateId)
    setLastCreated({
      tasksPath: bundle.tasksPath,
      templateId: selectedTemplateId,
      specSlug: bundle.specSlug,
    })
    if (selectedTemplateId === 'course-capstone') {
      startCapstoneFunnel(bundle.specSlug)
      trackCapstoneFunnelStep('created', { specSlug: bundle.specSlug })
    }
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

  const stepIndex = FORMALIZATION_STEP_ORDER.indexOf(wizardStep)

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
          {wizardStep !== 'intent' && !lastCreated ? (
            <button type="button" className="btn btn-secondary" data-testid="spec-studio-back" onClick={goBack}>
              <ChevronLeft size={14} />
              {t('specStudio.wizard.back')}
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
          )}

          {lastCreated ? (
            <>
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
            </>
          ) : wizardStep === 'preview' ? (
            <button
              type="button"
              className="btn btn-primary"
              data-testid="spec-studio-create"
              aria-disabled={nameMissing}
              onClick={handleCreate}
            >
              {t('specStudio.create')}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" data-testid="spec-studio-next" onClick={goNext}>
              {t('specStudio.wizard.next')}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      }
    >
      <p className="spec-studio-lead">{t('specStudio.lead')}</p>

      <ol className="spec-studio-steps" aria-label={t('specStudio.wizard.label')}>
        {FORMALIZATION_STEP_ORDER.map((step, index) => (
          <li
            key={step}
            className={`spec-studio-step${wizardStep === step ? ' spec-studio-step--active' : ''}${index < stepIndex ? ' spec-studio-step--done' : ''}`}
            data-testid={`spec-studio-step-${step}`}
          >
            <span className="spec-studio-step__index">{index + 1}</span>
            <span>{t(`specStudio.wizard.step.${step}` as TranslationKey)}</span>
          </li>
        ))}
      </ol>

      {wizardStep === 'intent' ? (
        <div className="spec-studio-fields">
          <label className="spec-studio-label">
            {t('specStudio.nameLabel')}
            <input
              ref={nameInputRef}
              type="text"
              className="settings-input"
              data-testid="spec-studio-name"
              value={specName}
              placeholder={t('spec.catalog.namePlaceholder')}
              onChange={(e) => {
                setSpecName(e.target.value)
                if (e.target.value.trim()) setShowNameHint(false)
              }}
            />
          </label>
          {showNameHint && nameMissing ? (
            <p className="spec-studio-name-hint" role="alert" data-testid="spec-studio-name-hint">
              {t('specStudio.nameRequired')}
            </p>
          ) : null}
          <label className="spec-studio-label">
            {t('specStudio.goalLabel')}
            <textarea
              className="settings-input spec-studio-goal"
              rows={3}
              data-testid="spec-studio-goal"
              value={userGoal}
              placeholder={t('specStudio.goalPlaceholder')}
              onChange={(e) => setUserGoal(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {wizardStep === 'template' ? (
        <>
          <div className="spec-studio-context" data-testid="spec-studio-context">
            <span>{t('specStudio.wizard.contextName', { name: specName.trim() })}</span>
            {userGoal.trim() ? <span>{t('specStudio.wizard.contextGoal', { goal: userGoal.trim() })}</span> : null}
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
        </>
      ) : null}

      {wizardStep === 'preview' && previewSummary ? (
        <div className="spec-studio-preview" data-testid="spec-studio-preview">
          <div className="spec-studio-preview__summary">
            <strong>{t(selectedTemplate.titleKey as TranslationKey)}</strong>
            <span data-testid="spec-studio-preview-stats">
              {t('specStudio.preview.stats', {
                files: String(previewSummary.fileCount),
                tasks: String(previewSummary.openTasks),
                acceptance: String(previewSummary.acceptanceItems),
              })}
            </span>
          </div>

          <div className="spec-studio-preview-tabs" role="tablist" aria-label={t('specStudio.preview.tabsLabel')}>
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={previewTab === tab}
                className={`spec-studio-preview-tab${previewTab === tab ? ' spec-studio-preview-tab--active' : ''}`}
                data-testid={`spec-studio-preview-tab-${tab}`}
                onClick={() => setPreviewTab(tab)}
              >
                {t(`specStudio.preview.tab.${tab}` as TranslationKey)}
              </button>
            ))}
          </div>

          <label className="spec-studio-label spec-studio-preview-editor">
            {t(`specStudio.preview.tab.${previewTab}` as TranslationKey)}
            <textarea
              className="settings-input spec-studio-preview-textarea"
              data-testid="spec-studio-preview-editor"
              value={activeDocContent}
              rows={12}
              spellCheck={false}
              onChange={(e) =>
                setDocEdits((prev) => ({
                  ...prev,
                  [previewTab]: e.target.value,
                }))
              }
            />
          </label>
        </div>
      ) : null}

      {lastCreated ? (
        <p className="spec-studio-created" data-testid="spec-studio-created-hint">
          {t('specStudio.createdHint', { path: lastCreated.tasksPath })}
        </p>
      ) : null}
    </ModalShell>
  )
}

export default SpecStudioPanel
