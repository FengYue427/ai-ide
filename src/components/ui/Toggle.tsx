export interface ToggleProps {
  checked: boolean
  onChange: () => void
  'aria-label'?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, 'aria-label': ariaLabel, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''} ${disabled ? 'settings-toggle--disabled' : ''}`}
      onClick={() => {
        if (disabled) return
        onChange()
      }}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span className="settings-toggle__thumb" />
    </button>
  )
}
