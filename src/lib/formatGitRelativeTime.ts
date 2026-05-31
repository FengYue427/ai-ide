/** Format a Git commit timestamp (seconds) as a locale-aware relative time. */
export function formatGitRelativeTime(
  timestampSec: number,
  locale: string,
  nowMs: number = Date.now(),
): string {
  const diffSec = Math.round(timestampSec - nowMs / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (abs < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffSec / 3600)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  const diffDay = Math.round(diffSec / 86400)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  const diffMonth = Math.round(diffSec / (86400 * 30))
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')
  const diffYear = Math.round(diffSec / (86400 * 365))
  return rtf.format(diffYear, 'year')
}
