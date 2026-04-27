import React, { useState, useEffect } from 'react'
import { X, Plus, Search, Tag, Copy, Trash2, Code, Save, Edit2, Check } from 'lucide-react'
import { snippetService, type CodeSnippet } from '../services/snippetService'

interface SnippetLibraryProps {
  onInsert: (code: string) => void
  currentLanguage?: string
  onClose: () => void
}

const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
  onInsert,
  currentLanguage,
  onClose
}) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage || 'all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formLanguage, setFormLanguage] = useState(currentLanguage || 'javascript')
  const [formTags, setFormTags] = useState('')

  useEffect(() => {
    loadSnippets()
  }, [])

  const loadSnippets = async () => {
    const builtin = snippetService.getBuiltinSnippets()
    const custom = await snippetService.getAllSnippets()
    setSnippets([...builtin, ...custom])
  }

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesLang = selectedLanguage === 'all' || s.language === selectedLanguage
    
    return matchesSearch && matchesLang
  })

  const languages = Array.from(new Set(snippets.map(s => s.language)))

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return

    if (editingSnippet) {
      await snippetService.updateSnippet(editingSnippet.id, {
        name: formName,
        description: formDescription,
        code: formCode,
        language: formLanguage,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean)
      })
    } else {
      await snippetService.saveSnippet({
        name: formName,
        description: formDescription,
        code: formCode,
        language: formLanguage,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean)
      })
    }

    resetForm()
    loadSnippets()
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个代码片段吗？')) {
      await snippetService.deleteSnippet(id)
      loadSnippets()
    }
  }

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet)
    setFormName(snippet.name)
    setFormDescription(snippet.description || '')
    setFormCode(snippet.code)
    setFormLanguage(snippet.language)
    setFormTags(snippet.tags.join(', '))
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormCode('')
    setFormLanguage(currentLanguage || 'javascript')
    setFormTags('')
    setEditingSnippet(null)
    setShowAddForm(false)
  }

  const handleInsert = (code: string) => {
    onInsert(code)
    onClose()
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={24} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>代码片段库</h3>
          </div>
          <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search & Filter */}
        {!showAddForm && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索代码片段..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">所有语言</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              新建
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {showAddForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：React useState Hook"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>描述</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="简短描述这个代码片段的用途"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>语言</label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="react, hook, state"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>代码</label>
                <textarea
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="在此粘贴或输入代码片段..."
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={resetForm} className="btn btn-secondary">
                  取消
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn btn-primary"
                  disabled={!formName.trim() || !formCode.trim()}
                >
                  <Save size={16} style={{ marginRight: '6px' }} />
                  {editingSnippet ? '更新' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSnippets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <Code size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>没有找到代码片段</p>
                  <p style={{ fontSize: '13px' }}>尝试其他搜索词或创建新片段</p>
                </div>
              ) : (
                filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{snippet.name}</h4>
                        {snippet.description && (
                          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {snippet.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: 'var(--bg-tertiary)',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}
                          >
                            {snippet.language}
                          </span>
                          {snippet.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => copyToClipboard(snippet.code)}
                          style={{ padding: '6px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          title="复制"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(snippet)}
                          style={{ padding: '6px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(snippet.id)}
                          style={{ padding: '6px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <pre
                      style={{
                        margin: '0 0 12px',
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        maxHeight: '150px'
                      }}
                    >
                      {snippet.code}
                    </pre>
                    <button
                      onClick={() => handleInsert(snippet.code)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      插入到编辑器
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SnippetLibrary
