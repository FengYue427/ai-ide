import { Suspense } from 'react'
import { AppShell } from './app/AppShell'
import { I18nProvider } from './i18n'

function App() {
  return (
    <I18nProvider>
      <Suspense fallback={null}>
        <AppShell />
      </Suspense>
    </I18nProvider>
  )
}

export default App
