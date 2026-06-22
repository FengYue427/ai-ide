import { Suspense } from 'react'
import { AppShell } from './app/AppShell'
import { ShareProgressPage } from './components/ShareProgressPage'
import { I18nProvider } from './i18n'
import { extractShareIdFromLocation, isShareProgressView } from './services/shareService'

function App() {
  const shareId = extractShareIdFromLocation()
  const progressView = isShareProgressView()

  if (shareId && progressView) {
    return (
      <I18nProvider>
        <ShareProgressPage shareId={shareId} />
      </I18nProvider>
    )
  }

  return (
    <I18nProvider>
      <Suspense fallback={null}>
        <AppShell />
      </Suspense>
    </I18nProvider>
  )
}

export default App
