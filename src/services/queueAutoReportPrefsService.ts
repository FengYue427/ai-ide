export interface QueueAutoReportPrefs {
  autoSaveOnComplete: boolean
  notifyOnComplete: boolean
}

const STORAGE_KEY = 'ai-ide:queue-auto-report'

const DEFAULTS: QueueAutoReportPrefs = {
  autoSaveOnComplete: false,
  notifyOnComplete: false,
}

export function loadQueueAutoReportPrefs(): QueueAutoReportPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<QueueAutoReportPrefs>
    return {
      autoSaveOnComplete: Boolean(parsed.autoSaveOnComplete),
      notifyOnComplete: Boolean(parsed.notifyOnComplete),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveQueueAutoReportPrefs(prefs: QueueAutoReportPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function notifyQueueComplete(title: string, body: string): void {
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
