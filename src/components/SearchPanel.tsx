import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, FileText, Replace, Search, X } from 'lucide-react'
import { workspaceContextService } from '../services/workspaceContextService'
import { useI18n } from '../i18n'
import {
  buildReplacePreview,
  collectSearchableFiles,
  highlightMatchSnippet,
  replaceInFile,
  searchInFiles,
  type ReplacePreviewItem,
  type SearchResult,
} from '../services/searchService'

interface SearchPanelProps {
  files: { name: string; content: string }[]
  onNavigate: (file: string, line: number, column?: number) => void
  onReplace: (file: string, newContent: string) => void
  onClose: () => void
}

type SearchScope = 'tabs' | 'workspace'

function ResultSnippet({
  line,
  query,
  options,
  selected,
}: {
  line: string
  query: string
  options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
  selected: boolean
}) {
  const marked = highlightMatchSnippet(line, query, options)
  const parts = marked.split(/(⟦|⟧)/)
  return (
    <span
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontFamily: 'var(--font-mono, monospace)',
      }}
      title={line.trim()}
    >
      {parts.map((part, index) => {
        if (part === '⟦' || part === '⟧') return null
        const prev = parts[index - 1]
        const highlighted = prev === '⟦'
        return (
          <span
            key={`${index}-${part}`}
            style={
              highlighted
                ? {
                    fontWeight: 800,
                    textDecoration: 'underline',
                    color: selected ? '#fff' : 'var(--accent-color)',
                  }
                : undefined
            }
          >
            {part}
          </span>
        )
      })}
    </span>
  )
}

const SearchPanel: React.FC<SearchPanelProps> = ({ files, onNavigate, onReplace, onClose }) => {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [scope, setScope] = useState<SearchScope>('tabs')
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [replacePreview, setReplacePreview] = useState<ReplacePreviewItem[] | null>(null)

  useEffect(() => workspaceContextService.onChange(() => setWorkspaceVersion((v) => v + 1)), [])

  const searchableFiles = useMemo(() => {
    if (scope === 'tabs') {
      return files.map((file) => ({ name: file.name, content: file.content }))
    }
    const workspaceFiles = workspaceContextService.getAllFiles().map((file) => ({
      path: file.path,
      content: file.content,
    }))
    return collectSearchableFiles(files, workspaceFiles)
  }, [files, scope, workspaceVersion])

  const searchOptions = useMemo(() => ({ caseSensitive, wholeWord, regex }), [caseSensitive, wholeWord, regex])

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      setSearchError(null)
      setReplacePreview(null)
      return
    }

    setSearching(true)
    try {
      const searchResults = searchInFiles(searchableFiles, query, searchOptions)
      setResults(searchResults)
      setSelectedIndex(0)
      setSearchError(null)
      setReplacePreview(null)
    } catch (error) {
      setResults([])
      setSearchError(error instanceof Error ? error.message : t('search.failed'))
    } finally {
      setSearching(false)
    }
  }, [searchableFiles, query, searchOptions])

  useEffect(() => {
    const timer = window.setTimeout(performSearch, 220)
    return () => window.clearTimeout(timer)
  }, [performSearch])

  const handleReplace = (result: SearchResult) => {
    const file = searchableFiles.find((item) => item.name === result.file)
    if (!file) return

    const newContent = replaceInFile(file.content, query, replaceQuery, searchOptions)
    onReplace(result.file, newContent)
    performSearch()
  }

  const handleReplaceAll = () => {
    const affectedFiles = new Set(results.map((result) => result.file))

    for (const fileName of affectedFiles) {
      const file = searchableFiles.find((item) => item.name === fileName)
      if (!file) continue

      const newContent = replaceInFile(file.content, query, replaceQuery, searchOptions)
      onReplace(fileName, newContent)
    }

    setReplacePreview(null)
    performSearch()
  }

  const openReplacePreview = () => {
    if (!query.trim() || results.length === 0) return
    setReplacePreview(buildReplacePreview(searchableFiles, query, searchOptions))
  }

  const groupedResults = results.reduce(
    (accumulator, result) => {
      if (!accumulator[result.file]) accumulator[result.file] = []
      accumulator[result.file].push(result)
      return accumulator
    },
    {} as Record<string, SearchResult[]>,
  )

  const fileCount = Object.keys(groupedResults).length

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (results.length === 0) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((index) => (index + 1) % results.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((index) => (index - 1 + results.length) % results.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const result = results[selectedIndex]
        if (result) onNavigate(result.file, result.line, result.column)
      } else if (event.key === 'Escape') {
        if (replacePreview) {
          setReplacePreview(null)
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [results, selectedIndex, onNavigate, onClose, replacePreview])

  return (
    <div
      className="search-panel"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg-primary)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={scope === 'workspace' ? t('search.placeholder.workspace') : t('search.placeholder.tabs')}
            autoFocus
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '13px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
            }}
            title={t('search.closeTitle')}
          >
            <X size={16} />
          </button>
        </div>

        {showReplace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ArrowRight size={16} style={{ color: 'var(--text-secondary)', marginLeft: '24px' }} />
            <input
              type="text"
              value={replaceQuery}
              onChange={(event) => setReplaceQuery(event.target.value)}
              placeholder={t('search.replacePlaceholder')}
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '13px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
            {[
              { label: t('search.option.case'), checked: caseSensitive, onChange: setCaseSensitive },
              { label: t('search.option.wholeWord'), checked: wholeWord, onChange: setWholeWord },
              { label: t('search.option.regex'), checked: regex, onChange: setRegex },
            ].map((option) => (
              <label
                key={option.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={(event) => option.onChange(event.target.checked)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(['tabs', 'workspace'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className="btn btn-secondary"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background:
                    scope === value
                      ? 'color-mix(in srgb, var(--accent-color) 12%, transparent)'
                      : undefined,
                }}
              >
                {value === 'tabs' ? t('search.scope.tabs') : t('search.scope.workspace')}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('search.summary', { matches: results.length, files: fileCount })}
            {scope === 'workspace' ? t('search.summary.workspaceFiles', { count: searchableFiles.length }) : ''}
          </span>
          <button
            onClick={() => setShowReplace((value) => !value)}
            className="btn btn-secondary"
            style={{ padding: '5px 9px', fontSize: '12px' }}
          >
            <Replace size={12} style={{ marginRight: '4px' }} />
            {showReplace ? t('search.toggleReplaceHide') : t('search.toggleReplaceShow')}
          </button>
        </div>

        {searchError && (
          <div style={{ marginTop: '8px', color: 'var(--danger-color)', fontSize: '12px' }}>{searchError}</div>
        )}

        {showReplace && results.length > 0 && !replacePreview && (
          <button
            onClick={openReplacePreview}
            className="btn btn-primary"
            style={{ marginTop: '8px', width: '100%', padding: '7px', fontSize: '12px' }}
          >
            {t('search.replaceAllPreview', { count: results.length })}
          </button>
        )}

        {replacePreview && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{t('search.replacePreview')}</div>
            <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '12px', marginBottom: '10px' }}>
              {replacePreview.map((item) => (
                <div key={item.file} style={{ marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{item.file}</span>
                  {' · '}
                  {t('search.replacePreviewMatches', { count: item.matchCount })}
                  {item.sampleLines.length > 0
                    ? t('search.replacePreviewLines', { lines: item.sampleLines.join(', ') })
                    : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setReplacePreview(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleReplaceAll}>
                {t('search.replaceConfirm')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(groupedResults).map(([file, fileResults]) => (
          <div key={file}>
            <div
              style={{
                padding: '7px 16px',
                background: 'var(--bg-secondary)',
                fontSize: '12px',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={12} />
              {file}{t('search.fileGroup', { count: fileResults.length })}
            </div>
            {fileResults.map((result, index) => {
              const globalIndex = results.indexOf(result)
              const selected = globalIndex === selectedIndex
              return (
                <div
                  key={`${file}-${index}`}
                  onClick={() => {
                    setSelectedIndex(globalIndex)
                    onNavigate(result.file, result.line, result.column)
                  }}
                  style={{
                    padding: '7px 16px 7px 32px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: selected ? 'var(--accent-color)' : 'transparent',
                    color: selected ? '#fff' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
                    <span style={{ opacity: 0.6, minWidth: '30px' }}>{result.line}</span>
                    <ResultSnippet
                      line={result.content}
                      query={query}
                      options={searchOptions}
                      selected={selected}
                    />
                  </div>
                  {showReplace && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleReplace(result)
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '10px',
                        background: selected ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: '6px',
                        color: selected ? 'var(--accent-color)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {t('search.replaceOne')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {results.length === 0 && query && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {searching ? t('search.searching') : t('search.noResults')}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPanel
