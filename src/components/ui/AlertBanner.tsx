import React from 'react'

interface AlertBannerProps {
  variant?: 'error' | 'success' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
}

export function AlertBanner({ variant = 'info', children, className = '' }: AlertBannerProps) {
  return (
    <div className={`alert-banner alert-banner--${variant} ${className}`.trim()} role="alert">
      {children}
    </div>
  )
}
