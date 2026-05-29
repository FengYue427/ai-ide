export interface BackgroundJobNotifyPrefs {
  notifyOnComplete: boolean
  autoMarkPlanStep: boolean
}

const STORAGE_KEY = 'ai-ide:background-job-notify'

const DEFAULTS: BackgroundJobNotifyPrefs = {
  notifyOnComplete: true,
  autoMarkPlanStep: false,
}

export function loadBackgroundJobNotifyPrefs(): BackgroundJobNotifyPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<BackgroundJobNotifyPrefs>
    return {
      notifyOnComplete:
        parsed.notifyOnComplete === undefined ? DEFAULTS.notifyOnComplete : Boolean(parsed.notifyOnComplete),
      autoMarkPlanStep:
        parsed.autoMarkPlanStep === undefined ? DEFAULTS.autoMarkPlanStep : Boolean(parsed.autoMarkPlanStep),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveBackgroundJobNotifyPrefs(prefs: BackgroundJobNotifyPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function notifyBackgroundJobDesktop(
  title: string,
  body: string,
  onClick?: () => void,
): void {
  if (typeof Notification === 'undefined') return

  const show = (notification: Notification) => {
    if (onClick) {
      notification.onclick = () => {
        window.focus()
        onClick()
        notification.close()
      }
    }
  }

  if (Notification.permission === 'granted') {
    show(new Notification(title, { body }))
    return
  }
  if (Notification.permission !== 'denied') {
    void Notification.requestPermission().then((perm) => {
      if (perm === 'granted') show(new Notification(title, { body }))
    })
  }
}
