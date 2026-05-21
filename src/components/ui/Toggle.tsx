export interface ToggleProps {
  checked: boolean
  onChange: () => void
  'aria-label'?: string
}

export function Toggle({ checked, onChange, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      onClick={onChange}
    >
      <span className="settings-toggle__thumb" />
    </button>
  )
}
