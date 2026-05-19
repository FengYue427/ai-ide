import React, { useState, useRef, useEffect } from 'react'
import { X, Mail, Lock, Github, Chrome, Eye, EyeOff, Sparkles, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { isOAuthEnabled } from '../lib/authFeatures'
import { authService, type User } from '../services/authService'

interface AuthModalProps {
  onClose: () => void
  onAuthenticated?: (user: User) => void
}

type AuthTab = 'login' | 'register' | 'forgot'

interface ValidationState {
  email: { valid: boolean; message: string }
  password: { valid: boolean; message: string }
  confirmPassword: { valid: boolean; message: string }
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  // 实时验证
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }
  
  const validatePassword = (value: string): boolean => {
    return value.length >= 8
  }
  
  const validateConfirmPassword = (value: string): boolean => {
    return value === password && value.length >= 8
  }
  
  const getValidation = (): ValidationState => ({
    email: { 
      valid: validateEmail(email), 
      message: touched.email && !validateEmail(email) ? '请输入有效的邮箱地址' : '' 
    },
    password: { 
      valid: validatePassword(password), 
      message: touched.password && !validatePassword(password) ? '密码至少需要 8 位字符' : '' 
    },
    confirmPassword: { 
      valid: validateConfirmPassword(confirmPassword), 
      message: touched.confirmPassword && !validateConfirmPassword(confirmPassword) ? '两次输入的密码不一致' : '' 
    }
  })
  
  const validation = getValidation()
  
  const isFormValid = () => {
    if (activeTab === 'login') return validateEmail(email) && password.length > 0
    if (activeTab === 'register') return validateEmail(email) && validatePassword(password) && validateConfirmPassword(confirmPassword)
    if (activeTab === 'forgot') return validateEmail(email)
    return false
  }

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Enter' && !loading && isFormValid()) {
        const form = document.querySelector('.auth-form') as HTMLFormElement
        form?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, email, password, confirmPassword, activeTab])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      setTouched({ email: true, password: true })
      return
    }
    setLoading(true)
    setError('')

    const result = await authService.login(email, password)
    if (result.success && result.user) {
      onAuthenticated?.(result.user)
      onClose()
    } else {
      setError(result.error || '邮箱或密码错误')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTouched({ email: true, password: true, confirmPassword: true })

    if (!isFormValid()) return

    setLoading(true)

    const result = await authService.register(email, password, email.split('@')[0])
    if (result.success && result.user) {
      onAuthenticated?.(result.user)
      onClose()
    } else {
      setError(result.error || '注册失败，请稍后重试')
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true })
    if (!validateEmail(email)) return
    setLoading(true)
    setError('')

    const result = await authService.requestPasswordReset(email)
    if (result.success) {
      setMessage(result.message || '重置密码邮件已发送，请检查邮箱')
    } else {
      setError(result.error || '发送失败，请稍后重试')
    }
    setLoading(false)
  }

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/oauth/signin/${provider}`
  }

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab)
    setError('')
    setMessage('')
    setTouched({})
    setFocusedField(null)
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
        {activeTab === 'login' && isOAuthEnabled() && (
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
              {touched.email && validation.email.valid && <Check size={14} className="validation-icon valid" />}
            </label>
            <div className={`auth-input-wrapper ${focusedField === 'email' ? 'focused' : ''} ${validation.email.message ? 'error' : ''}`}>
              <input
                ref={emailRef}
                type="email"
                className="auth-input"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (!touched.email) setTouched(prev => ({ ...prev, email: true }))
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="name@example.com"
                required
              />
              {validation.email.message && <AlertCircle size={16} className="input-error-icon" />}
            </div>
            {validation.email.message && <span className="field-error">{validation.email.message}</span>}
          </div>

          {activeTab !== 'forgot' && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} />
                密码
                {touched.password && validation.password.valid && <Check size={14} className="validation-icon valid" />}
                {activeTab === 'login' && (
                  <span className="auth-forgot-link" onClick={() => switchTab('forgot')}>
                    忘记密码？
                  </span>
                )}
              </label>
              <div className={`auth-input-wrapper ${focusedField === 'password' ? 'focused' : ''} ${validation.password.message ? 'error' : ''}`}>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (!touched.password) setTouched(prev => ({ ...prev, password: true }))
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
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
                {validation.password.message && <AlertCircle size={16} className="input-error-icon" />}
              </div>
              {validation.password.message && <span className="field-error">{validation.password.message}</span>}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} />
                确认密码
                {touched.confirmPassword && validation.confirmPassword.valid && <Check size={14} className="validation-icon valid" />}
              </label>
              <div className={`auth-input-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''} ${validation.confirmPassword.message ? 'error' : ''}`}>
                <input
                  ref={confirmPasswordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value)
                    if (!touched.confirmPassword) setTouched(prev => ({ ...prev, confirmPassword: true }))
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="再次输入密码"
                  required
                />
                {validation.confirmPassword.message && <AlertCircle size={16} className="input-error-icon" />}
              </div>
              {validation.confirmPassword.message && <span className="field-error">{validation.confirmPassword.message}</span>}
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

    </div>
  )
}

export default AuthModal
