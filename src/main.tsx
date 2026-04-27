import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 移除加载动画 - 使用 requestAnimationFrame 确保在渲染后执行
// 并清理 timer 防止内存泄漏
const loadingScreen = document.getElementById('loading-screen')
if (loadingScreen) {
  // 确保至少显示 500ms 避免闪烁
  const minDisplayTime = 500
  const startTime = performance.now()
  
  const removeLoadingScreen = () => {
    const elapsed = performance.now() - startTime
    const remaining = Math.max(0, minDisplayTime - elapsed)
    
    setTimeout(() => {
      loadingScreen.style.transition = 'opacity 0.3s ease-out'
      loadingScreen.style.opacity = '0'
      
      const removeTimer = setTimeout(() => {
        loadingScreen.remove()
      }, 300)
      
      // 页面卸载时清理
      window.addEventListener('beforeunload', () => {
        clearTimeout(removeTimer)
      }, { once: true })
    }, remaining)
  }
  
  // 使用 rAF 确保 React 已渲染
  requestAnimationFrame(() => {
    requestAnimationFrame(removeLoadingScreen)
  })
}
