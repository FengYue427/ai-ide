export interface BackgroundJobNotifyPrefs {
  notifyOnComplete: boolean
}

const STORAGE_KEY = 'ai-ide:background-job-notify'

const DEFAULTS: BackgroundJobNotifyPrefs = {
  notifyOnComplete: true,
}

export function loadBackgroundJobNotifyPrefs(): BackgroundJobNotifyPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<BackgroundJobNotifyPrefs>
    return {
      notifyOnComplete:
        parsed.notifyOnComplete === undefined ? DEFAULTS.notifyOnComplete : Boolean(parsed.notifyOnComplete),
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

export function notifyBackgroundJobDesktop(title: string, body: string): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    new Notification(title, { body })
    return
  }
  if (Notification.permission !== 'denied') {
    void Notification.requestPermission().then((perm) => {
      if (perm === 'granted') new Notification(title, { body })
    })
  }
}
