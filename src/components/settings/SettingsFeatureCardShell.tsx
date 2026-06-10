import type { ReactNode } from 'react'

export interface SettingsFeatureCardShellProps {
  testId: string
  icon: ReactNode
  title: ReactNode
  badge?: ReactNode
  description: ReactNode
  children: ReactNode
}

/** Shared layout for v1.2–v1.6 production status cards in Settings → Features. */
export function SettingsFeatureCardShell({
  testId,
  icon,
  title,
  badge,
  description,
  children,
}: SettingsFeatureCardShellProps) {
  return (
    <div className="settings-card settings-card--grid" data-testid={testId}>
      <div className="settings-privacy-row">
        {icon}
        <strong>{title}</strong>
        {badge}
      </div>
      <p className="settings-privacy-text">{description}</p>
      <ul className="settings-v12-status-list">{children}</ul>
    </div>
  )
}
