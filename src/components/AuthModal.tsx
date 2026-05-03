import React, { useState } from 'react'
import { X, Mail, Lock, Github, Chrome, Eye, EyeOff } from 'lucide-react'

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
      setError('登录失败')
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
      setError('密码至少需要8位')
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
        setMessage('注册成功，请登录')
        setPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setError(data.error || '注册失败')
      }
    } catch {
      setError('注册失败')
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
        setMessage('重置密码邮件已发送')
      } else {
        setError('发送失败')
      }
    } catch {
      setError('发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/signin/${provider}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{activeTab === 'login' ? '登录' : activeTab === 'register' ? '注册' : '找回密码'}</span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        
        <div className="modal-body">
          {error && (
            <div style={{ padding: '10px 12px', background: '#ef444420', color: '#ef4444', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          
          {message && (
            <div style={{ padding: '10px 12px', background: '#22c55e20', color: '#22c55e', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              {message}
            </div>
          )}

          {/* OAuth 登录 */}
          {activeTab === 'login' && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={() => handleOAuthLogin('github')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Github size={18} />
                  <span>GitHub</span>
                </button>
                <button
                  onClick={() => handleOAuthLogin('google')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Chrome size={18} />
                  <span>Google</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                或使用邮箱
              </div>
            </>
          )}

          {/* 邮箱表单 */}
          <form onSubmit={activeTab === 'login' ? handleEmailLogin : activeTab === 'register' ? handleRegister : handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {activeTab !== 'forgot' && (
              <div className="form-group">
                <label className="form-label">密码</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">确认密码</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? '处理中...' : activeTab === 'login' ? '登录' : activeTab === 'register' ? '注册' : '发送重置邮件'}
            </button>
          </form>

          {/* 切换选项 */}
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {activeTab === 'login' ? (
              <>
                <span style={{ cursor: 'pointer', color: 'var(--accent-color)' }} onClick={() => { setActiveTab('forgot'); setError(''); setMessage('') }}>忘记密码？</span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span style={{ cursor: 'pointer', color: 'var(--accent-color)' }} onClick={() => { setActiveTab('register'); setError(''); setMessage('') }}>注册账号</span>
              </>
            ) : (
              <span style={{ cursor: 'pointer', color: 'var(--accent-color)' }} onClick={() => { setActiveTab('login'); setError(''); setMessage('') }}>← 返回登录</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
