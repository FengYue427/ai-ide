import React, { useEffect, useMemo, useState } from 'react'
import { Check, Code, Copy, Edit2, Plus, Save, Search, Tag, Trash2, X } from 'lucide-react'
import { snippetService, type CodeSnippet } from '../services/snippetService'
import { useI18n } from '../i18n'
import type { ConfirmRequest, ToastKind } from './FeedbackCenter'

interface SnippetLibraryProps {
  onInsert: (code: string) => void
  currentLanguage?: string
  notify: (kind: ToastKind, title: string, detail?: string) => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  onClose: () => void
}

const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
  onInsert,
  currentLanguage,
  notify,
  requestConfirm,
  onClose,
}) => {
  const { t, language } = useI18n()
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage || 'all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formLanguage, setFormLanguage] = useState(currentLanguage || 'javascript')
  const [formTags, setFormTags] = useState('')

  const loadSnippets = async () => {
    const builtin = snippetService.getBuiltinSnippets(language)
    const custom = await snippetService.getAllSnippets()
    setSnippets([...builtin, ...custom])
  }

  useEffect(() => {
    void loadSnippets()
  }, [language])

  const languages = useMemo(() => Array.from(new Set(snippets.map((snippet) => snippet.language))), [snippets])

  const filteredSnippets = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return snippets.filter((snippet) => {
      const matchesSearch =
        snippet.name.toLowerCase().includes(query) ||
        snippet.description?.toLowerCase().includes(query) ||
        snippet.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        snippet.code.toLowerCase().includes(query)
      const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage
      return matchesSearch && matchesLanguage
    })
  }, [searchQuery, selectedLanguage, snippets])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormCode('')
    setFormLanguage(currentLanguage || 'javascript')
    setFormTags('')
    setEditingSnippet(null)
    setShowAddForm(false)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      code: formCode,
      language: formLanguage,
      tags: formTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }

    if (editingSnippet) {
      await snippetService.updateSnippet(editingSnippet.id, payload)
      notify('success', t('snippet.notify.updated'), payload.name)
    } else {
      await snippetService.saveSnippet(payload)
      notify('success', t('snippet.notify.saved'), payload.name)
    }

    resetForm()
    loadSnippets()
  }

  const handleDelete = async (snippet: CodeSnippet) => {
    if (snippet.id.startsWith('builtin-')) {
      notify('info', t('snippet.notify.builtinNoDelete'), t('snippet.notify.builtinNoDeleteDetail'))
      return
    }

    const confirmed = await requestConfirm({
      title: t('snippet.confirm.delete.title'),
      message: t('snippet.confirm.delete.message', { name: snippet.name }),
      confirmText: t('wm.confirm.delete.confirm'),
      tone: 'danger',
    })
    if (!confirmed) return

    await snippetService.deleteSnippet(snippet.id)
    notify('success', t('snippet.notify.deleted'), snippet.name)
    loadSnippets()
  }

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet.id.startsWith('builtin-') ? null : snippet)
    setFormName(snippet.id.startsWith('builtin-') ? `${snippet.name}${t('snippet.copySuffix')}` : snippet.name)
    setFormDescription(snippet.description || '')
    setFormCode(snippet.code)
    setFormLanguage(snippet.language)
    setFormTags(snippet.tags.join(', '))
    setShowAddForm(true)
  }

  const copyToClipboard = async (snippet: CodeSnippet) => {
    await navigator.clipboard.writeText(snippet.code)
    setCopiedId(snippet.id)
    notify('success', t('snippet.notify.copied'), snippet.name)
    window.setTimeout(() => setCopiedId(null), 1400)
  }

  const handleInsert = (snippet: CodeSnippet) => {
    onInsert(snippet.code)
    notify('success', t('snippet.notify.inserted'), snippet.name)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--snippet" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title modal-title-row">
            <Code size={18} />
            {t('snippet.title')}
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        {!showAddForm ? (
          <div className="snippet-library-toolbar">
            <div className="snippet-library-search">
              <Search size={16} className="snippet-library-search__icon" />
              <input
                type="text"
                className="form-input snippet-library-search__input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('snippet.searchPlaceholder')}
              />
            </div>
            <select
              className="form-input"
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
            >
              <option value="all">{t('snippet.allLanguages')}</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setShowAddForm(true)} className="btn btn-primary">
              <Plus size={16} />
              {t('snippet.new')}
            </button>
          </div>
        ) : null}

        <div className="modal-body">
          {showAddForm ? (
            <div className="snippet-library-form">
              <div className="snippet-library-form__row">
                <div>
                  <label className="form-label">{t('snippet.form.name')}</label>
                  <input
                    className="form-input"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    placeholder={t('snippet.form.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="form-label">{t('snippet.form.language')}</label>
                  <select
                    className="form-input"
                    value={formLanguage}
                    onChange={(event) => setFormLanguage(event.target.value)}
                  >
                    {['javascript', 'typescript', 'python', 'html', 'css', 'json', 'go', 'rust'].map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">{t('snippet.form.description')}</label>
                <input
                  className="form-input"
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  placeholder={t('snippet.form.descriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="form-label">{t('snippet.form.tags')}</label>
                <input
                  className="form-input"
                  value={formTags}
                  onChange={(event) => setFormTags(event.target.value)}
                  placeholder={t('snippet.form.tagsPlaceholder')}
                />
              </div>
              <div>
                <label className="form-label">{t('snippet.form.code')}</label>
                <textarea
                  className="form-input snippet-library-form__code"
                  value={formCode}
                  onChange={(event) => setFormCode(event.target.value)}
                  placeholder={t('snippet.form.codePlaceholder')}
                  rows={11}
                />
              </div>
              <div className="snippet-library-form__actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={!formName.trim() || !formCode.trim()}
                >
                  <Save size={16} />
                  {editingSnippet ? t('snippet.form.update') : t('common.save')}
                </button>
              </div>
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div className="snippet-library-empty">
              <Code size={44} className="snippet-library-empty__icon" />
              <div className="snippet-library-empty__title">{t('snippet.empty.title')}</div>
              <div>{t('snippet.empty.desc')}</div>
            </div>
          ) : (
            <div className="snippet-library-list">
              {filteredSnippets.map((snippet) => (
                <div key={snippet.id} className="snippet-library-card">
                  <div className="snippet-library-card__head">
                    <div>
                      <div className="snippet-library-card__title-row">
                        <h4 className="snippet-library-card__title">{snippet.name}</h4>
                        {snippet.id.startsWith('builtin-') ? (
                          <span className="status-pill">{t('snippet.badge.builtin')}</span>
                        ) : null}
                      </div>
                      {snippet.description ? (
                        <p className="snippet-library-card__desc">{snippet.description}</p>
                      ) : null}
                    </div>
                    <div className="snippet-library-card__actions">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(snippet)}
                        className="snippet-icon-btn"
                        title={t('snippet.copyTitle')}
                      >
                        {copiedId === snippet.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(snippet)}
                        className="snippet-icon-btn"
                        title={t('snippet.editTitle')}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(snippet)}
                        className="snippet-icon-btn snippet-icon-btn--danger"
                        title={t('snippet.deleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="snippet-library-card__tags">
                    <span className="status-pill">{snippet.language}</span>
                    {snippet.tags.map((tag) => (
                      <span key={tag} className="status-pill">
                        <Tag size={11} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <pre className="snippet-library-card__code">{snippet.code}</pre>
                  <button
                    type="button"
                    onClick={() => handleInsert(snippet)}
                    className="btn btn-primary snippet-library-card__insert"
                  >
                    {t('snippet.insert')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SnippetLibrary
