import React, { useState } from 'react'
import { X, AlertCircle, AlertTriangle, Lightbulb, CheckCircle, RefreshCw, Shield, Zap, Award } from 'lucide-react'
import { codeReviewService, type CodeReviewResult, type CodeIssue } from '../services/codeReviewService'
import { testGenerationService } from '../services/testGenerationService'
import type { AIModel } from '../services/aiService'
import { useI18n } from '../i18n'
import styles from './CodeReviewPanel.module.css'

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
  onTestsGenerated?: (fileName: string, content: string) => void
  layout?: 'overlay' | 'docked'
}

const CodeReviewPanel: React.FC<CodeReviewPanelProps> = ({
  code,
  language,
  filename,
  aiConfig,
  onClose,
  onTestsGenerated,
  layout = 'overlay',
}) => {
  const { t, language: uiLocale } = useI18n()
  const [result, setResult] = useState<CodeReviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingTests, setGeneratingTests] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings' | 'suggestions'>('all')
  const [, setShowQuickCheck] = useState(true)

  const runReview = async () => {
    setLoading(true)
    try {
      const reviewResult = await codeReviewService.reviewCode(
        code,
        language,
        filename,
        aiConfig,
        uiLocale,
      )
      setResult(reviewResult)
      setShowQuickCheck(false)
    } finally {
      setLoading(false)
    }
  }

  const runGenerateTests = async () => {
    setGeneratingTests(true)
    setTestError(null)
    try {
      const testCode = await testGenerationService.generateTests(code, language, filename, aiConfig)
      const base = filename.includes('.') ? filename.replace(/\.[^.]+$/, '') : filename
      const ext =
        language === 'typescript' || language === 'tsx'
          ? 'test.ts'
          : language === 'python'
            ? 'test.py'
            : 'test.js'
      onTestsGenerated?.(`${base}.${ext}`, testCode)
    } catch (error) {
      setTestError(error instanceof Error ? error.message : t('review.testGenFailed'))
    } finally {
      setGeneratingTests(false)
    }
  }

  const runQuickCheck = () => {
    const quickIssues = codeReviewService.quickCheck(code, language, uiLocale)
    setResult({
      score: quickIssues.length === 0 ? 90 : Math.max(50, 90 - quickIssues.length * 5),
      summary:
        quickIssues.length === 0
          ? t('review.quickPass')
          : t('review.quickIssues', { count: quickIssues.length }),
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
        return <AlertCircle size={16} className={styles.iconError} />
      case 'warning':
        return <AlertTriangle size={16} className={styles.iconWarning} />
      case 'suggestion':
        return <Lightbulb size={16} className={styles.iconSuggestion} />
      case 'style':
        return <CheckCircle size={16} className={styles.iconStyle} />
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
    <div className={layout === 'docked' ? styles.panelDocked : styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Shield size={20} className={styles.headerIcon} />
          <span className={styles.headerTitle}>{t('review.title')}</span>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!result ? (
          <div className={styles.initialState}>
            <Shield size={48} className={styles.initialIcon} />
            <p className={styles.initialText}>
              {t('review.pickMode')}
            </p>
            <div className={styles.actionButtons}>
              <button
                onClick={runQuickCheck}
                className={`btn btn-secondary ${styles.actionButton}`}
              >
                <Zap size={16} className={styles.buttonIcon} />
                {t('review.quickCheck')}
              </button>
              <button
                onClick={runReview}
                disabled={!aiConfig.apiKey || loading}
                className={`btn btn-primary ${styles.actionButton}`}
              >
                {loading ? (
                  <RefreshCw size={16} className={styles.spinningIcon} />
                ) : (
                  <Shield size={16} className={styles.buttonIcon} />
                )}
                {loading ? t('review.reviewing') : t('review.aiReview')}
              </button>
              <button
                onClick={runGenerateTests}
                disabled={!aiConfig.apiKey || generatingTests || loading}
                className={`btn btn-secondary ${styles.actionButton}`}
              >
                {generatingTests ? (
                  <RefreshCw size={16} className={styles.spinningIcon} />
                ) : (
                  <Award size={16} className={styles.buttonIcon} />
                )}
                {generatingTests ? t('review.generatingTests') : t('review.generateTests')}
              </button>
            </div>
            {testError && (
              <p className={styles.errorText}>{testError}</p>
            )}
            {!aiConfig.apiKey && (
              <p className={styles.warningText}>
                {t('review.needApiKey')}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Score */}
            <div className={styles.scoreCard}>
              <div
                className={styles.scoreCircle}
                style={{
                  border: `4px solid ${getScoreColor(result.score)}`,
                  color: getScoreColor(result.score)
                }}
              >
                {result.score}
              </div>
              <Award size={20} className={styles.scoreIcon} style={{ color: getScoreColor(result.score) }} />
              <p className={styles.scoreSummary}>{result.summary}</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {[
                { key: 'all', label: t('review.filter.all'), count: result.issues.length },
                { key: 'errors', label: t('review.filter.errors'), count: issueCounts.errors },
                { key: 'warnings', label: t('review.filter.warnings'), count: issueCounts.warnings },
                { key: 'suggestions', label: t('review.filter.suggestions'), count: issueCounts.suggestions },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={styles.tabBadge}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Issues List */}
            <div className={styles.issuesList}>
              {filteredIssues.length === 0 ? (
                <div className={styles.emptyState}>
                  <CheckCircle size={32} className={styles.emptyIcon} />
                  <p className={styles.emptyText}>{t('review.noIssuesInFilter')}</p>
                </div>
              ) : (
                filteredIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`${styles.issueItem} ${
                      issue.type === 'error' ? styles.issueItemError :
                      issue.type === 'warning' ? styles.issueItemWarning :
                      issue.type === 'suggestion' ? styles.issueItemSuggestion :
                      styles.issueItemStyle
                    }`}
                  >
                    <div className={styles.issueHeader}>
                      {getIssueIcon(issue.type)}
                      <span className={styles.issueType}>
                        {issue.type}
                      </span>
                      {issue.line && (
                        <span className={styles.issueLine}>
                          {t('review.line', { line: issue.line })}
                        </span>
                      )}
                    </div>
                    <p className={styles.issueMessage}>{issue.message}</p>
                    {issue.code && (
                      <code className={styles.issueCode}>
                        {issue.code}
                      </code>
                    )}
                    {issue.suggestion && (
                      <p className={styles.issueSuggestion}>
                        <Lightbulb size={14} className={styles.suggestionIcon} />
                        {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actionFooter}>
              <button
                onClick={() => setShowQuickCheck(true)}
                className={`btn btn-secondary ${styles.footerButton}`}
              >
                {t('review.back')}
              </button>
              <button
                onClick={() => {
                  setResult(null)
                  runReview()
                }}
                disabled={loading}
                className={`btn btn-primary ${styles.footerButton}`}
              >
                <RefreshCw size={14} className={styles.footerButtonIcon} />
                {t('review.rerun')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CodeReviewPanel
