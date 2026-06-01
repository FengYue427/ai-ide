import React, { useState, useRef, useEffect } from 'react'
import { X, Mail, Lock, Github, Chrome, Eye, EyeOff, Sparkles, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { useI18n } from '../i18n'
import { localizeAuthApiError } from '../lib/authApiErrors'
import { isForgotPasswordEnabled, isOAuthEnabled } from '../lib/authFeatures'
import { authService, type User } from '../services/authService'

interface AuthModalProps {
  initialTab?: AuthTab
  onClose: () => void
  onAuthenticated?: (user: User) => void
}

type AuthTab = 'login' | 'register' | 'forgot'

interface ValidationState {
  email: { valid: boolean; message: string }
  password: { valid: boolean; message: string }
  confirmPassword: { valid: boolean; message: string }
}

const AuthModal: React.FC<AuthModalProps> = ({ initialTab = 'login', onClose, onAuthenticated }) => {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

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
      message: touched.email && !validateEmail(email) ? t('auth.error.invalidEmail') : '',
    },
    password: {
      valid: validatePassword(password),
      message: touched.password && !validatePassword(password) ? t('auth.error.passwordLength') : '',
    },
    confirmPassword: {
      valid: validateConfirmPassword(confirmPassword),
      message:
        touched.confirmPassword && !validateConfirmPassword(confirmPassword)
          ? t('auth.error.passwordMismatch')
          : '',
    },
  })

  const validation = getValidation()

  const isFormValid = () => {
    if (activeTab === 'login') return validateEmail(email) && password.length > 0
    if (activeTab === 'register')
      return validateEmail(email) && validatePassword(password) && validateConfirmPassword(confirmPassword)
    if (activeTab === 'forgot') return validateEmail(email)
    return false
  }

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
  }, [loading, email, password, confirmPassword, activeTab, onClose])

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
      setError(localizeAuthApiError(result.error, t) || t('auth.error.loginFailed'))
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
      setError(localizeAuthApiError(result.error, t) || t('auth.error.registerFailed'))
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
      setMessage(result.message || t('auth.success.resetSent'))
    } else {
      setError(localizeAuthApiError(result.error, t) || t('auth.error.resetFailed'))
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
      case 'login':
        return t('auth.title.login')
      case 'register':
        return t('auth.title.register')
      case 'forgot':
        return t('auth.title.forgot')
    }
  }

  const getSubtitle = () => {
    switch (activeTab) {
      case 'login':
        return t('auth.subtitle.login')
      case 'register':
        return t('auth.subtitle.register')
      case 'forgot':
        return t('auth.subtitle.forgot')
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
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

        <div className="auth-logo-section">
          <div className="auth-logo">
            <Sparkles size={28} />
          </div>
          <h2 className="auth-title">{getTitle()}</h2>
          <p className="auth-subtitle">{getSubtitle()}</p>
        </div>

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

        {activeTab === 'login' && isOAuthEnabled() && (
          <div className="auth-oauth-section">
            <button className="auth-oauth-btn auth-oauth-github" onClick={() => handleOAuthLogin('github')}>
              <Github size={18} />
              <span>{t('auth.oauth.github')}</span>
            </button>
            <button className="auth-oauth-btn auth-oauth-google" onClick={() => handleOAuthLogin('google')}>
              <Chrome size={18} />
              <span>{t('auth.oauth.google')}</span>
            </button>

            <div className="auth-divider">
              <span>{t('auth.oauth.divider')}</span>
            </div>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={
            activeTab === 'login'
              ? handleEmailLogin
              : activeTab === 'register'
                ? handleRegister
                : handleForgotPassword
          }
        >
          <div className="auth-input-group">
            <label className="auth-input-label">
              <Mail size={14} />
              {t('auth.email')}
              {touched.email && validation.email.valid && <Check size={14} className="validation-icon valid" />}
            </label>
            <div
              className={`auth-input-wrapper ${focusedField === 'email' ? 'focused' : ''} ${validation.email.message ? 'error' : ''}`}
            >
              <input
                ref={emailRef}
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (!touched.email) setTouched((prev) => ({ ...prev, email: true }))
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
                {t('auth.password')}
                {touched.password && validation.password.valid && (
                  <Check size={14} className="validation-icon valid" />
                )}
                {activeTab === 'login' && isForgotPasswordEnabled() && (
                  <span className="auth-forgot-link" onClick={() => switchTab('forgot')}>
                    {t('auth.forgotLink')}
                  </span>
                )}
              </label>
              <div
                className={`auth-input-wrapper ${focusedField === 'password' ? 'focused' : ''} ${validation.password.message ? 'error' : ''}`}
              >
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (!touched.password) setTouched((prev) => ({ ...prev, password: true }))
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={
                    activeTab === 'register'
                      ? t('auth.placeholder.passwordRegister')
                      : t('auth.placeholder.password')
                  }
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
                {t('auth.confirmPassword')}
                {touched.confirmPassword && validation.confirmPassword.valid && (
                  <Check size={14} className="validation-icon valid" />
                )}
              </label>
              <div
                className={`auth-input-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''} ${validation.confirmPassword.message ? 'error' : ''}`}
              >
                <input
                  ref={confirmPasswordRef}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (!touched.confirmPassword) setTouched((prev) => ({ ...prev, confirmPassword: true }))
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('auth.placeholder.confirm')}
                  required
                />
                {validation.confirmPassword.message && <AlertCircle size={16} className="input-error-icon" />}
              </div>
              {validation.confirmPassword.message && (
                <span className="field-error">{validation.confirmPassword.message}</span>
              )}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-loading">
                <span className="auth-loading-dot" />
                <span className="auth-loading-dot" />
                <span className="auth-loading-dot" />
              </span>
            ) : activeTab === 'login' ? (
              t('auth.submit.login')
            ) : activeTab === 'register' ? (
              t('auth.submit.register')
            ) : (
              t('auth.submit.forgot')
            )}
          </button>
        </form>

        <div className="auth-footer">
          {activeTab === 'login' ? (
            <>
              {t('auth.footer.noAccount')}
              <span className="auth-switch-link" onClick={() => switchTab('register')}>
                {t('auth.footer.register')}
              </span>
            </>
          ) : activeTab === 'register' ? (
            <>
              {t('auth.footer.hasAccount')}
              <span className="auth-switch-link" onClick={() => switchTab('login')}>
                {t('auth.footer.login')}
              </span>
            </>
          ) : (
            <span className="auth-switch-link" onClick={() => switchTab('login')}>
              {t('auth.footer.backLogin')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
