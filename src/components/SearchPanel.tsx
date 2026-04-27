import React, { useState, useEffect, useCallback } from 'react'
import { X, Search, Replace, ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react'
import { searchInFiles, replaceInFile, type SearchResult } from '../services/searchService'

interface SearchPanelProps {
  files: { name: string; content: string }[]
  onNavigate: (file: string, line: number) => void
  onReplace: (file: string, newContent: string) => void
  onClose: () => void
}

const SearchPanel: React.FC<SearchPanelProps> = ({ files, onNavigate, onReplace, onClose }) => {
  const [query, setQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const [searching, setSearching] = useState(false)

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const searchResults = searchInFiles(files, query, { caseSensitive, wholeWord, regex })
    setResults(searchResults)
    setSelectedIndex(0)
    setSearching(false)
  }, [files, query, caseSensitive, wholeWord, regex])

  useEffect(() => {
    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [performSearch])

  const handleReplace = (result: SearchResult) => {
    const file = files.find(f => f.name === result.file)
    if (!file) return

    const newContent = replaceInFile(file.content, query, replaceQuery, { caseSensitive, wholeWord, regex })
    onReplace(result.file, newContent)
    
    // 更新结果
    performSearch()
  }

  const handleReplaceAll = () => {
    const affectedFiles = new Set(results.map(r => r.file))
    
    for (const fileName of affectedFiles) {
      const file = files.find(f => f.name === fileName)
      if (!file) continue
      
      const newContent = replaceInFile(file.content, query, replaceQuery, { caseSensitive, wholeWord, regex })
      onReplace(fileName, newContent)
    }
    
    performSearch()
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.file]) acc[result.file] = []
    acc[result.file].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="search-panel" style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg-primary)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 搜索头部 */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文件内容..."
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '13px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={16} />
          </button>
        </div>

        {/* 替换输入 */}
        {showReplace && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ArrowRight size={16} style={{ color: 'var(--text-secondary)', marginLeft: '24px' }} />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="替换为..."
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '13px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        )}

        {/* 选项和统计 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
              区分大小写
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
              全词匹配
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} />
              正则
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowReplace(!showReplace)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <Replace size={12} style={{ marginRight: '4px' }} />
              {showReplace ? '隐藏替换' : '显示替换'}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {results.length} 个结果
            </span>
          </div>
        </div>

        {/* 替换全部按钮 */}
        {showReplace && results.length > 0 && (
          <button
            onClick={handleReplaceAll}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '6px',
              fontSize: '12px',
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--bg-primary)',
              cursor: 'pointer'
            }}
          >
            全部替换 ({results.length} 处)
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(groupedResults).map(([file, fileResults]) => (
          <div key={file}>
            <div style={{ 
              padding: '6px 16px', 
              background: 'var(--bg-secondary)',
              fontSize: '12px',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FileText size={12} />
              {file} ({fileResults.length})
            </div>
            {fileResults.map((result, idx) => {
              const globalIdx = results.indexOf(result)
              return (
                <div
                  key={`${file}-${idx}`}
                  onClick={() => {
                    setSelectedIndex(globalIdx)
                    onNavigate(result.file, result.line)
                  }}
                  style={{
                    padding: '6px 16px 6px 32px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: globalIdx === selectedIndex ? 'var(--accent-color)' : 'transparent',
                    color: globalIdx === selectedIndex ? 'var(--bg-primary)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ opacity: 0.5, minWidth: '30px' }}>{result.line}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {result.content.slice(0, 50)}
                    </span>
                  </div>
                  {showReplace && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReplace(result)
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        background: globalIdx === selectedIndex ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: '3px',
                        color: globalIdx === selectedIndex ? 'var(--accent-color)' : 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      替换
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        
        {results.length === 0 && query && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {searching ? '搜索中...' : '未找到匹配'}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPanel
