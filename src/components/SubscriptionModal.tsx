import React, { useState, useEffect } from 'react'
import { X, Check, Zap, Crown, Building2, Loader2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  features: string[]
  limits: {
    aiRequestsPerDay: number
    workspaces: number
    storageGB: number
  }
}

interface SubscriptionModalProps {
  onClose: () => void
  currentPlan?: string
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap size={24} />,
  pro: <Crown size={24} />,
  enterprise: <Building2 size={24} />
}

const planColors: Record<string, { gradient: string; border: string }> = {
  free: {
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    border: '#64748b'
  },
  pro: {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: '#6366f1'
  },
  enterprise: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    border: '#f59e0b'
  }
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, currentPlan = 'free' }) => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/subscription/plans')
      .then(res => res.json())
      .then(data => {
        if (data.plans) setPlans(data.plans)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      onClose()
      return
    }
    
    setProcessing(true)
    setSelectedPlan(planId)
    
    try {
      // 调用 Stripe checkout API
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('创建支付会话失败')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      alert('支付请求失败')
    } finally {
      setProcessing(false)
    }
  }

  const formatLimit = (value: number, unit: string) => {
    if (value === -1) return '无限'
    return `${value}${unit}`
  }

  if (loading) {
    return (
      <div className="sub-modal-overlay" onClick={onClose}>
        <div className="sub-modal" onClick={e => e.stopPropagation()}>
          <div className="sub-loading">
            <Loader2 size={32} className="spin" />
            <p>加载中...</p>
          </div>
        </div>
        <style>{`
          .sub-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .sub-modal {
            background: var(--bg-primary, #1e1e1e);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: 20px;
            width: 900px;
            max-width: 95vw;
            max-height: 90vh;
            overflow-y: auto;
            padding: 40px;
          }
          .sub-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 60px;
            color: var(--text-secondary, #858585);
          }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="sub-header">
          <div>
            <h2 className="sub-title">选择您的计划</h2>
            <p className="sub-subtitle">升级以解锁更多高级功能</p>
          </div>
          <button className="sub-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 计划卡片 */}
        <div className="sub-plans-grid">
          {plans.map(plan => {
            const isCurrent = plan.name === currentPlan
            const isSelected = plan.id === selectedPlan
            const colors = planColors[plan.name] || planColors.free

            return (
              <div
                key={plan.id}
                className={`sub-plan-card ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                style={{ '--plan-border': colors.border } as React.CSSProperties}
              >
                {isCurrent && <div className="sub-current-badge">当前计划</div>}
                
                <div className="sub-plan-header" style={{ background: colors.gradient }}>
                  <div className="sub-plan-icon">{planIcons[plan.name]}</div>
                  <h3 className="sub-plan-name">{plan.displayName}</h3>
                  <p className="sub-plan-desc">{plan.description}</p>
                </div>

                <div className="sub-plan-price">
                  <span className="sub-price-symbol">$</span>
                  <span className="sub-price-value">{plan.price}</span>
                  <span className="sub-price-period">/月</span>
                </div>

                <div className="sub-plan-limits">
                  <div className="sub-limit-item">
                    <span className="sub-limit-label">AI 请求</span>
                    <span className="sub-limit-value">
                      {formatLimit(plan.limits.aiRequestsPerDay, '次/天')}
                    </span>
                  </div>
                  <div className="sub-limit-item">
                    <span className="sub-limit-label">工作区</span>
                    <span className="sub-limit-value">
                      {formatLimit(plan.limits.workspaces, '个')}
                    </span>
                  </div>
                  <div className="sub-limit-item">
                    <span className="sub-limit-label">存储空间</span>
                    <span className="sub-limit-value">
                      {formatLimit(plan.limits.storageGB, 'GB')}
                    </span>
                  </div>
                </div>

                <ul className="sub-plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="sub-feature-item">
                      <Check size={16} className="sub-feature-check" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`sub-plan-btn ${isCurrent ? 'current' : ''}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing || isCurrent}
                >
                  {processing && isSelected ? (
                    <Loader2 size={18} className="spin" />
                  ) : isCurrent ? (
                    '当前使用中'
                  ) : (
                    plan.price === 0 ? '免费使用' : '立即升级'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .sub-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .sub-modal {
          background: var(--bg-primary, #1e1e1e);
          border: 1px solid var(--border-color, #3c3c3c);
          border-radius: 20px;
          width: 1000px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          padding: 40px;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sub-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .sub-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary, #cccccc);
          margin: 0 0 8px;
        }

        .sub-subtitle {
          font-size: 15px;
          color: var(--text-secondary, #858585);
          margin: 0;
        }

        .sub-close-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #858585);
          cursor: pointer;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .sub-close-btn:hover {
          background: var(--bg-secondary, #252526);
          color: var(--text-primary, #cccccc);
        }

        .sub-plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .sub-plan-card {
          background: var(--bg-secondary, #252526);
          border: 2px solid var(--border-color, #3c3c3c);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .sub-plan-card:hover {
          transform: translateY(-4px);
          border-color: var(--plan-border, #3c3c3c);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .sub-plan-card.current {
          border-color: #22c55e;
        }

        .sub-plan-card.selected {
          border-color: var(--plan-border, #6366f1);
        }

        .sub-current-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #22c55e;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          z-index: 1;
        }

        .sub-plan-header {
          padding: 24px;
          color: white;
          text-align: center;
        }

        .sub-plan-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          backdrop-filter: blur(4px);
        }

        .sub-plan-name {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 6px;
        }

        .sub-plan-desc {
          font-size: 13px;
          opacity: 0.8;
          margin: 0;
        }

        .sub-plan-price {
          padding: 20px 24px;
          text-align: center;
          border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .sub-price-symbol {
          font-size: 20px;
          color: var(--text-secondary, #858585);
          vertical-align: top;
        }

        .sub-price-value {
          font-size: 40px;
          font-weight: 700;
          color: var(--text-primary, #cccccc);
        }

        .sub-price-period {
          font-size: 14px;
          color: var(--text-secondary, #858585);
        }

        .sub-plan-limits {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .sub-limit-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 13px;
        }

        .sub-limit-label {
          color: var(--text-secondary, #858585);
        }

        .sub-limit-value {
          color: var(--text-primary, #cccccc);
          font-weight: 500;
        }

        .sub-plan-features {
          padding: 20px 24px;
          margin: 0;
          list-style: none;
        }

        .sub-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          font-size: 14px;
          color: var(--text-primary, #cccccc);
        }

        .sub-feature-check {
          color: #22c55e;
          flex-shrink: 0;
        }

        .sub-plan-btn {
          width: calc(100% - 48px);
          margin: 0 24px 24px;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sub-plan-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        .sub-plan-btn:disabled {
          background: var(--bg-tertiary, #2d2d30);
          color: var(--text-secondary, #858585);
          cursor: not-allowed;
          transform: none;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sub-plans-grid {
            grid-template-columns: 1fr;
          }
          .sub-modal {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  )
}

export default SubscriptionModal
