import React, { useState } from 'react'
import { X, Mail, Lock, Github, Chrome, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react'

interface AuthModalProps {
  onClose: () => void
}

type AuthTab = 'login' | 'register' | 'forgot'

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (res.ok) {
        window.location.reload()
      } else {
        setError('邮箱或密码错误')
      }
    } catch {
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    if (password.length < 8) {
      setError('密码至少需要 8 位字符')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: email.split('@')[0] })
      })
      
      if (res.ok) {
        setActiveTab('login')
        setMessage('注册成功！请使用新账号登录')
        setPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setError(data.error || '注册失败，请稍后重试')
      }
    } catch {
      setError('注册失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (res.ok) {
        setMessage('重置密码邮件已发送，请检查邮箱')
      } else {
        setError('发送失败，请稍后重试')
      }
    } catch {
      setError('发送失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/signin/${provider}`
  }

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab)
    setError('')
    setMessage('')
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'login': return '欢迎回来'
      case 'register': return '创建账号'
      case 'forgot': return '找回密码'
    }
  }

  const getSubtitle = () => {
    switch (activeTab) {
      case 'login': return '登录以同步您的工作区数据'
      case 'register': return '注册后即可开始使用云同步功能'
      case 'forgot': return '输入您的邮箱以重置密码'
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="auth-modal-header">
          {activeTab !== 'login' && (
            <button className="auth-back-btn" onClick={() => switchTab('login')}>
              <ArrowLeft size={18} />
            </button>
          )}
          <button className="auth-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Logo 区域 */}
        <div className="auth-logo-section">
          <div className="auth-logo">
            <Sparkles size={28} />
          </div>
          <h2 className="auth-title">{getTitle()}</h2>
          <p className="auth-subtitle">{getSubtitle()}</p>
        </div>

        {/* 消息提示 */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <span className="auth-alert-icon">!</span>
            {error}
          </div>
        )}
        
        {message && (
          <div className="auth-alert auth-alert-success">
            <span className="auth-alert-icon">✓</span>
            {message}
          </div>
        )}

        {/* 登录时的 OAuth 选项 */}
        {activeTab === 'login' && (
          <div className="auth-oauth-section">
            <button className="auth-oauth-btn auth-oauth-github" onClick={() => handleOAuthLogin('github')}>
              <Github size={18} />
              <span>使用 GitHub 登录</span>
            </button>
            <button className="auth-oauth-btn auth-oauth-google" onClick={() => handleOAuthLogin('google')}>
              <Chrome size={18} />
              <span>使用 Google 登录</span>
            </button>
            
            <div className="auth-divider">
              <span>或使用邮箱登录</span>
            </div>
          </div>
        )}

        {/* 表单 */}
        <form className="auth-form" onSubmit={activeTab === 'login' ? handleEmailLogin : activeTab === 'register' ? handleRegister : handleForgotPassword}>
          <div className="auth-input-group">
            <label className="auth-input-label">
              <Mail size={14} />
              邮箱地址
            </label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          {activeTab !== 'forgot' && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} />
                密码
                {activeTab === 'login' && (
                  <span className="auth-forgot-link" onClick={() => switchTab('forgot')}>
                    忘记密码？
                  </span>
                )}
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={activeTab === 'register' ? '至少 8 位字符' : '输入密码'}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} />
                确认密码
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-loading">
                <span className="auth-loading-dot" />
                <span className="auth-loading-dot" />
                <span className="auth-loading-dot" />
              </span>
            ) : (
              activeTab === 'login' ? '登录' : activeTab === 'register' ? '创建账号' : '发送重置邮件'
            )}
          </button>
        </form>

        {/* 底部切换 */}
        <div className="auth-footer">
          {activeTab === 'login' ? (
            <>
              还没有账号？
              <span className="auth-switch-link" onClick={() => switchTab('register')}>
                立即注册
              </span>
            </>
          ) : activeTab === 'register' ? (
            <>
              已有账号？
              <span className="auth-switch-link" onClick={() => switchTab('login')}>
                直接登录
              </span>
            </>
          ) : (
            <span className="auth-switch-link" onClick={() => switchTab('login')}>
              ← 返回登录
            </span>
          )}
        </div>
      </div>

      {/* 样式 */}
      <style>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
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

        .auth-modal {
          background: var(--bg-primary, #1e1e1e);
          border: 1px solid var(--border-color, #3c3c3c);
          border-radius: 16px;
          width: 400px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-modal-header {
          display: flex;
          justify-content: flex-end;
          padding: 16px 16px 0;
          gap: 8px;
        }

        .auth-back-btn,
        .auth-close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #858585);
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .auth-back-btn:hover,
        .auth-close-btn:hover {
          background: var(--bg-secondary, #252526);
          color: var(--text-primary, #cccccc);
        }

        .auth-logo-section {
          text-align: center;
          padding: 0 32px 24px;
        }

        .auth-logo {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .auth-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #cccccc);
          margin: 0 0 8px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: var(--text-secondary, #858585);
          margin: 0;
        }

        .auth-alert {
          margin: 0 32px 16px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .auth-alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .auth-alert-success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .auth-alert-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: currentColor;
          color: var(--bg-primary, #1e1e1e);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
          flex-shrink: 0;
        }

        .auth-oauth-section {
          padding: 0 32px 16px;
        }

        .auth-oauth-btn {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #3c3c3c);
          border-radius: 10px;
          background: var(--bg-secondary, #252526);
          color: var(--text-primary, #cccccc);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          margin-bottom: 10px;
        }

        .auth-oauth-btn:hover {
          background: var(--bg-tertiary, #2d2d30);
          border-color: var(--accent-color, #6366f1);
          transform: translateY(-1px);
        }

        .auth-oauth-github:hover {
          border-color: #333;
        }

        .auth-oauth-google:hover {
          border-color: #4285f4;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 20px 0 4px;
          color: var(--text-secondary, #858585);
          font-size: 13px;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-color, #3c3c3c);
        }

        .auth-form {
          padding: 0 32px 24px;
        }

        .auth-input-group {
          margin-bottom: 16px;
        }

        .auth-input-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #858585);
          margin-bottom: 8px;
        }

        .auth-forgot-link {
          margin-left: auto;
          color: var(--accent-color, #6366f1);
          cursor: pointer;
          font-weight: 400;
          transition: opacity 0.2s;
        }

        .auth-forgot-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .auth-input-wrapper {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 12px 16px;
          padding-right: 44px;
          border: 1px solid var(--border-color, #3c3c3c);
          border-radius: 10px;
          background: var(--bg-secondary, #252526);
          color: var(--text-primary, #cccccc);
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .auth-input:focus {
          outline: none;
          border-color: var(--accent-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .auth-input::placeholder {
          color: var(--text-secondary, #858585);
        }

        .auth-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary, #858585);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .auth-password-toggle:hover {
          color: var(--text-primary, #cccccc);
          background: var(--bg-tertiary, #2d2d30);
        }

        .auth-submit-btn {
          width: 100%;
          padding: 14px 24px;
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .auth-loading-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          animation: bounce 0.6s infinite alternate;
        }

        .auth-loading-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .auth-loading-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-6px); opacity: 0.5; }
        }

        .auth-footer {
          text-align: center;
          padding: 16px 32px 32px;
          font-size: 14px;
          color: var(--text-secondary, #858585);
          border-top: 1px solid var(--border-color, #3c3c3c);
        }

        .auth-switch-link {
          color: var(--accent-color, #6366f1);
          font-weight: 500;
          cursor: pointer;
          margin-left: 6px;
          transition: opacity 0.2s;
        }

        .auth-switch-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        /* 响应式 */
        @media (max-width: 480px) {
          .auth-modal {
            width: 100%;
            max-width: none;
            border-radius: 0;
            max-height: 100vh;
          }
          
          .auth-modal-header,
          .auth-logo-section,
          .auth-oauth-section,
          .auth-form,
          .auth-footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          
          .auth-alert {
            margin-left: 24px;
            margin-right: 24px;
          }
        }
      `}</style>
    </div>
  )
}

export default AuthModal
