import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 移除加载动画
const loadingScreen = document.getElementById('loading-screen')
if (loadingScreen) {
  loadingScreen.style.transition = 'opacity 0.3s'
  loadingScreen.style.opacity = '0'
  setTimeout(() => loadingScreen.remove(), 300)
}
