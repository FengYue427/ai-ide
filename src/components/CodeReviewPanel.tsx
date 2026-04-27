import React, { useState } from 'react'
import { X, AlertCircle, AlertTriangle, Lightbulb, CheckCircle, RefreshCw, Shield, Zap, Award } from 'lucide-react'
import { codeReviewService, type CodeReviewResult, type CodeIssue } from '../services/codeReviewService'
import type { AIModel } from '../services/aiService'

interface CodeReviewPanelProps {
  code: string
  language: string
  filename: string
  aiConfig: {
    provider: AIModel
    apiKey: string
    model?: string
    endpoint?: string
  }
  onClose: () => void
}

const CodeReviewPanel: React.FC<CodeReviewPanelProps> = ({
  code,
  language,
  filename,
  aiConfig,
  onClose
}) => {
  const [result, setResult] = useState<CodeReviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings' | 'suggestions'>('all')
  const [showQuickCheck, setShowQuickCheck] = useState(true)

  const runReview = async () => {
    setLoading(true)
    try {
      const reviewResult = await codeReviewService.reviewCode(
        code,
        language,
        filename,
        aiConfig
      )
      setResult(reviewResult)
      setShowQuickCheck(false)
    } finally {
      setLoading(false)
    }
  }

  const runQuickCheck = () => {
    const quickIssues = codeReviewService.quickCheck(code, language)
    setResult({
      score: quickIssues.length === 0 ? 90 : Math.max(50, 90 - quickIssues.length * 5),
      summary: quickIssues.length === 0 ? '快速检查通过，未发现明显问题' : `发现 ${quickIssues.length} 个问题`,
      issues: quickIssues,
      improvements: [],
      security: [],
      performance: []
    })
    setShowQuickCheck(false)
  }

  const getIssueIcon = (type: CodeIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={16} style={{ color: '#ef4444' }} />
      case 'warning':
        return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
      case 'suggestion':
        return <Lightbulb size={16} style={{ color: '#3b82f6' }} />
      case 'style':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const filteredIssues = result?.issues.filter(issue => {
    if (activeTab === 'all') return true
    return issue.type === activeTab.slice(0, -1) // Remove 's' from plural
  }) || []

  const issueCounts = {
    errors: result?.issues.filter(i => i.type === 'error').length || 0,
    warnings: result?.issues.filter(i => i.type === 'warning').length || 0,
    suggestions: result?.issues.filter(i => i.type === 'suggestion').length || 0
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        bottom: 0,
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontWeight: 600 }}>代码审查</span>
        </div>
        <button onClick={onClose} style={{ padding: '4px' }}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Shield size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
              选择审查方式分析代码质量
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={runQuickCheck}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                <Zap size={16} style={{ marginRight: '8px' }} />
                快速检查（本地规则）
              </button>
              <button
                onClick={runReview}
                disabled={!aiConfig.apiKey || loading}
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
              >
                {loading ? (
                  <RefreshCw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Shield size={16} style={{ marginRight: '8px' }} />
                )}
                {loading ? '审查中...' : 'AI 深度审查'}
              </button>
            </div>
            {!aiConfig.apiKey && (
              <p style={{ marginTop: '16px', fontSize: '12px', color: '#ef4444' }}>
                请先配置 AI API Key
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Score */}
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: `4px solid ${getScoreColor(result.score)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getScoreColor(result.score)
                }}
              >
                {result.score}
              </div>
              <Award size={20} style={{ marginBottom: '8px', color: getScoreColor(result.score) }} />
              <p style={{ margin: 0, fontSize: '14px' }}>{result.summary}</p>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}
            >
              {[
                { key: 'all', label: '全部', count: result.issues.length },
                { key: 'errors', label: '错误', count: issueCounts.errors },
                { key: 'warnings', label: '警告', count: issueCounts.warnings },
                { key: 'suggestions', label: '建议', count: issueCounts.suggestions }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-color)' : 'transparent'}`,
                    color: activeTab === tab.key ? 'var(--accent-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: 'var(--bg-tertiary)',
                        fontSize: '10px'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Issues List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredIssues.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <CheckCircle size={32} style={{ marginBottom: '8px', color: '#10b981' }} />
                  <p>未发现此类问题</p>
                </div>
              ) : (
                filteredIssues.map((issue, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${
                        issue.type === 'error' ? '#ef4444' :
                        issue.type === 'warning' ? '#f59e0b' :
                        issue.type === 'suggestion' ? '#3b82f6' : '#10b981'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      {getIssueIcon(issue.type)}
                      <span style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>
                        {issue.type}
                      </span>
                      {issue.line && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                          第 {issue.line} 行
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '13px' }}>{issue.message}</p>
                    {issue.code && (
                      <code
                        style={{
                          display: 'block',
                          padding: '8px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          marginBottom: '8px',
                          overflow: 'auto'
                        }}
                      >
                        {issue.code}
                      </code>
                    )}
                    {issue.suggestion && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '4px'
                        }}
                      >
                        <Lightbulb size={14} style={{ marginTop: '2px' }} />
                        {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowQuickCheck(true)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                返回选择
              </button>
              <button
                onClick={() => {
                  setResult(null)
                  runReview()
                }}
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <RefreshCw size={14} style={{ marginRight: '6px' }} />
                重新审查
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CodeReviewPanel
