import React, { useState, useEffect, useCallback } from 'react'
import { X, Activity, Clock, Cpu, MemoryStick, Play, RotateCcw, BarChart3 } from 'lucide-react'

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
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({
  isRunning,
  output,
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [currentRun, setCurrentRun] = useState<PerformanceMetrics | null>(null)
  const [showDetails, setShowDetails] = useState(false)

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
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
          <Activity size={20} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontWeight: 600 }}>性能分析</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearHistory}
            style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="清除历史"
          >
            <RotateCcw size={16} />
          </button>
          <button onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Current Run */}
        {isRunning && currentRun && (
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid var(--accent-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Play size={16} style={{ color: 'var(--accent-color)', animation: 'pulse 1s infinite' }} />
              <span style={{ fontWeight: 500 }}>运行中...</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
              {formatTime(performance.now() - currentRun.startTime)}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {metrics.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              统计概览
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <BarChart3 size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>平均耗时</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(averageTime)}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>最快</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{formatTime(fastest)}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={14} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>最慢</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{formatTime(slowest)}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Activity size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>运行次数</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{metrics.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Run History */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            运行历史
          </h4>
          
          {metrics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Activity size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>暂无运行记录</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>运行代码后将显示性能数据</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>运行 #{metrics.length - index}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(metric.endTime || metric.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        执行时间
                      </div>
                      <span style={{ fontWeight: 600 }}>{formatTime(metric.executionTime || 0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        <MemoryStick size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        内存估算
                      </div>
                      <span style={{ fontWeight: 600 }}>{formatBytes(metric.memoryUsage || 0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        <Cpu size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        输出大小
                      </div>
                      <span style={{ fontWeight: 600 }}>{formatBytes(metric.outputLength)}</span>
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
