import React, { useState, useEffect } from 'react'
import { X, Activity, Clock, Cpu, MemoryStick, Play, RotateCcw, BarChart3 } from 'lucide-react'
import { useI18n } from '../i18n'
import styles from './PerformancePanel.module.css'

interface PerformanceMetrics {
  startTime: number
  endTime?: number
  executionTime?: number
  memoryUsage?: number
  cpuTime?: number
  outputLength: number
}

interface PerformancePanelProps {
  isRunning: boolean
  output: string[]
  onClose: () => void
  layout?: 'overlay' | 'docked'
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({
  isRunning,
  output,
  onClose,
  layout = 'overlay',
}) => {
  const { t } = useI18n()
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [currentRun, setCurrentRun] = useState<PerformanceMetrics | null>(null)
  // Start tracking when running begins
  useEffect(() => {
    if (isRunning) {
      const newRun: PerformanceMetrics = {
        startTime: performance.now(),
        outputLength: 0
      }
      setCurrentRun(newRun)
    }
  }, [isRunning])

  // End tracking when running stops
  useEffect(() => {
    if (!isRunning && currentRun) {
      const endTime = performance.now()
      const outputStr = output.join('')
      const completed: PerformanceMetrics = {
        ...currentRun,
        endTime,
        executionTime: endTime - currentRun.startTime,
        outputLength: outputStr.length,
        // Estimate memory based on output size (rough approximation)
        memoryUsage: outputStr.length * 2 + 1024
      }
      
      setMetrics(prev => [completed, ...prev].slice(0, 20)) // Keep last 20 runs
      setCurrentRun(null)
    }
  }, [isRunning, output, currentRun])

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)} ms`
    return `${(ms / 1000).toFixed(2)} s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const averageTime = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.executionTime || 0), 0) / metrics.length
    : 0

  const fastest = metrics.length > 0
    ? Math.min(...metrics.map(m => m.executionTime || Infinity))
    : 0

  const slowest = metrics.length > 0
    ? Math.max(...metrics.map(m => m.executionTime || 0))
    : 0

  const clearHistory = () => {
    setMetrics([])
  }

  return (
    <div className={layout === 'docked' ? styles.panelDocked : styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Activity size={20} className={styles.headerIcon} />
          <span className={styles.headerTitle}>{t('perf.title')}</span>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={clearHistory}
            className={styles.clearButton}
            title={t('perf.clearHistory')}
          >
            <RotateCcw size={16} />
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Current Run */}
        {isRunning && currentRun && (
          <div className={styles.currentRun}>
            <div className={styles.currentRunHeader}>
              <Play size={16} className={styles.runningIcon} />
              <span className={styles.runningLabel}>{t('perf.running')}</span>
            </div>
            <div className={styles.currentTime}>
              {formatTime(performance.now() - currentRun.startTime)}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {metrics.length > 0 && (
          <div className={styles.summary}>
            <h4 className={styles.sectionTitle}>
              {t('perf.overview')}
            </h4>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <BarChart3 size={14} className={styles.statIcon} />
                  <span className={styles.statLabel}>{t('perf.avgTime')}</span>
                </div>
                <span className={styles.statValue}>{formatTime(averageTime)}</span>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <Clock size={14} className={styles.statIconFastest} />
                  <span className={styles.statLabel}>{t('perf.fastest')}</span>
                </div>
                <span className={styles.statValueFastest}>{formatTime(fastest)}</span>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <Clock size={14} className={styles.statIconSlowest} />
                  <span className={styles.statLabel}>{t('perf.slowest')}</span>
                </div>
                <span className={styles.statValueSlowest}>{formatTime(slowest)}</span>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <Activity size={14} className={styles.statIcon} />
                  <span className={styles.statLabel}>{t('perf.runCount')}</span>
                </div>
                <span className={styles.statValue}>{metrics.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Run History */}
        <div className={styles.history}>
          <h4 className={styles.sectionTitle}>
            {t('perf.history')}
          </h4>
          
          {metrics.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={48} className={styles.emptyIcon} />
              <p className={styles.emptyText}>{t('perf.noRuns')}</p>
              <p className={styles.emptyHint}>{t('perf.noRunsHint')}</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {metrics.map((metric, index) => (
                <div key={index} className={styles.runItem}>
                  <div className={styles.runItemHeader}>
                    <span className={styles.runLabel}>{t('perf.runLabel', { index: metrics.length - index })}</span>
                    <span className={styles.runTime}>
                      {new Date(metric.endTime || metric.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className={styles.runMetrics}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricLabel}>
                        <Clock size={10} className={styles.metricIcon} />
                        {t('perf.execTime')}
                      </div>
                      <span className={styles.metricValue}>{formatTime(metric.executionTime || 0)}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricLabel}>
                        <MemoryStick size={10} className={styles.metricIcon} />
                        {t('perf.memoryEst')}
                      </div>
                      <span className={styles.metricValue}>{formatBytes(metric.memoryUsage || 0)}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <div className={styles.metricLabel}>
                        <Cpu size={10} className={styles.metricIcon} />
                        {t('perf.outputSize')}
                      </div>
                      <span className={styles.metricValue}>{formatBytes(metric.outputLength)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformancePanel
