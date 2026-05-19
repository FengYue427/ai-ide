import React, { useEffect, useMemo, useState } from 'react'
import { Check, Code, Copy, Edit2, Plus, Save, Search, Tag, Trash2, X } from 'lucide-react'
import { snippetService, type CodeSnippet } from '../services/snippetService'
import type { ConfirmRequest, ToastKind } from './FeedbackCenter'

interface SnippetLibraryProps {
  onInsert: (code: string) => void
  currentLanguage?: string
  notify: (kind: ToastKind, title: string, detail?: string) => void
  requestConfirm: (request: ConfirmRequest) => Promise<boolean>
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  boxSizing: 'border-box',
}

const iconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
}

const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
  onInsert,
  currentLanguage,
  notify,
  requestConfirm,
  onClose,
}) => {
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
    const builtin = snippetService.getBuiltinSnippets()
    const custom = await snippetService.getAllSnippets()
    setSnippets([...builtin, ...custom])
  }

  useEffect(() => {
    loadSnippets()
  }, [])

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
      notify('success', '代码片段已更新', payload.name)
    } else {
      await snippetService.saveSnippet(payload)
      notify('success', '代码片段已保存', payload.name)
    }

    resetForm()
    loadSnippets()
  }

  const handleDelete = async (snippet: CodeSnippet) => {
    if (snippet.id.startsWith('builtin-')) {
      notify('info', '内置片段不可删除', '你可以复制后另存为自己的片段。')
      return
    }

    const confirmed = await requestConfirm({
      title: '删除代码片段',
      message: `确定删除“${snippet.name}”吗？`,
      confirmText: '删除',
      tone: 'danger',
    })
    if (!confirmed) return

    await snippetService.deleteSnippet(snippet.id)
    notify('success', '代码片段已删除', snippet.name)
    loadSnippets()
  }

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet.id.startsWith('builtin-') ? null : snippet)
    setFormName(snippet.id.startsWith('builtin-') ? `${snippet.name} 副本` : snippet.name)
    setFormDescription(snippet.description || '')
    setFormCode(snippet.code)
    setFormLanguage(snippet.language)
    setFormTags(snippet.tags.join(', '))
    setShowAddForm(true)
  }

  const copyToClipboard = async (snippet: CodeSnippet) => {
    await navigator.clipboard.writeText(snippet.code)
    setCopiedId(snippet.id)
    notify('success', '已复制代码片段', snippet.name)
    window.setTimeout(() => setCopiedId(null), 1400)
  }

  const handleInsert = (snippet: CodeSnippet) => {
    onInsert(snippet.code)
    notify('success', '代码片段已插入', snippet.name)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '760px', maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} />
            代码片段库
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        {!showAddForm && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索名称、标签或代码"
                style={{ ...inputStyle, paddingLeft: '38px' }}
              />
            </div>
            <select value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)} style={inputStyle}>
              <option value="all">全部语言</option>
              {languages.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '6px' }} />
              新建
            </button>
          </div>
        )}

        <div className="modal-body" style={{ overflow: 'auto' }}>
          {showAddForm ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px' }}>
                <div>
                  <label className="form-label">名称</label>
                  <input value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="例如：React useState Hook" style={{ ...inputStyle, marginTop: '6px' }} />
                </div>
                <div>
                  <label className="form-label">语言</label>
                  <select value={formLanguage} onChange={(event) => setFormLanguage(event.target.value)} style={{ ...inputStyle, marginTop: '6px' }}>
                    {['javascript', 'typescript', 'python', 'html', 'css', 'json', 'go', 'rust'].map((language) => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">描述</label>
                <input value={formDescription} onChange={(event) => setFormDescription(event.target.value)} placeholder="简短描述这个片段的用途" style={{ ...inputStyle, marginTop: '6px' }} />
              </div>
              <div>
                <label className="form-label">标签</label>
                <input value={formTags} onChange={(event) => setFormTags(event.target.value)} placeholder="react, hook, state" style={{ ...inputStyle, marginTop: '6px' }} />
              </div>
              <div>
                <label className="form-label">代码</label>
                <textarea
                  value={formCode}
                  onChange={(event) => setFormCode(event.target.value)}
                  placeholder="在这里粘贴或输入代码片段"
                  rows={11}
                  style={{ ...inputStyle, marginTop: '6px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={resetForm} className="btn btn-secondary">取消</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={!formName.trim() || !formCode.trim()}>
                  <Save size={16} style={{ marginRight: '6px' }} />
                  {editingSnippet ? '更新' : '保存'}
                </button>
              </div>
            </div>
          ) : filteredSnippets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 20px', color: 'var(--text-secondary)' }}>
              <Code size={44} style={{ marginBottom: '12px', opacity: 0.45 }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>没有找到代码片段</div>
              <div style={{ fontSize: '13px' }}>换个关键词，或新建一个常用片段。</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredSnippets.map((snippet) => (
                <div key={snippet.id} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{snippet.name}</h4>
                        {snippet.id.startsWith('builtin-') && <span className="status-pill">内置</span>}
                      </div>
                      {snippet.description && <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{snippet.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => copyToClipboard(snippet)} style={iconButtonStyle} title="复制">
                        {copiedId === snippet.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button onClick={() => handleEdit(snippet)} style={iconButtonStyle} title="编辑或另存">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(snippet)} style={{ ...iconButtonStyle, color: 'var(--danger-color)' }} title="删除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span className="status-pill">{snippet.language}</span>
                    {snippet.tags.map((tag) => (
                      <span key={tag} className="status-pill">
                        <Tag size={11} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <pre style={{ margin: '0 0 12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', overflow: 'auto', maxHeight: '150px' }}>
                    {snippet.code}
                  </pre>
                  <button onClick={() => handleInsert(snippet)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    插入到编辑器
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
