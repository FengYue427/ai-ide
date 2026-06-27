import { Suspense } from 'react'
import { AppShell } from './app/AppShell'
import { ShareProgressPage } from './components/ShareProgressPage'
import { extractShareIdFromLocation, isShareProgressView } from './services/shareService'

function App() {
  const shareId = extractShareIdFromLocation()
  const progressView = isShareProgressView()

  if (shareId && progressView) {
    return <ShareProgressPage shareId={shareId} />
  }

  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  )
}

export default App
