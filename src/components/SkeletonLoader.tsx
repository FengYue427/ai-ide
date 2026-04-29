import React from 'react'

interface SkeletonLoaderProps {
  theme?: 'dark' | 'light'
}

/**
 * 编辑器骨架屏加载组件
 * 模拟代码行的闪烁效果，提升加载体验
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark'
  
  // 生成模拟代码行
  const lines = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    width: Math.random() * 60 + 30, // 30% - 90% 随机宽度
    indent: i < 5 ? i * 2 : Math.random() * 4, // 前5行模拟缩进
    delay: i * 0.05, // 阶梯式延迟
  }))

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: isDark ? '#1e1e1e' : '#ffffff',
        padding: '16px 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: `${16 + line.indent * 12}px`,
          }}
        >
          {/* 行号区域 */}
          <div
            style={{
              width: '40px',
              height: '14px',
              background: isDark 
                ? 'linear-gradient(90deg, #2d2d2d 0%, #3d3d3d 50%, #2d2d2d 100%)'
                : 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
              borderRadius: '2px',
              animation: `shimmer 1.5s ease-in-out ${line.delay}s infinite`,
              backgroundSize: '200% 100%',
            }}
          />
          
          {/* 代码行 */}
          <div
            style={{
              width: `${line.width}%`,
              height: '14px',
              background: isDark
                ? 'linear-gradient(90deg, #2d2d2d 0%, #404040 50%, #2d2d2d 100%)'
                : 'linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)',
              borderRadius: '2px',
              animation: `shimmer 1.5s ease-in-out ${line.delay}s infinite`,
              backgroundSize: '200% 100%',
              maxWidth: '600px',
            }}
          />
        </div>
      ))}

      {/* 底部加载提示 */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: isDark ? 'rgba(45, 45, 45, 0.9)' : 'rgba(240, 240, 240, 0.9)',
          borderRadius: '20px',
          fontSize: '13px',
          color: isDark ? '#858585' : '#666',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            border: `2px solid ${isDark ? '#404040' : '#e0e0e0'}`,
            borderTopColor: isDark ? '#007acc' : '#0969da',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span>正在加载编辑器...</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default SkeletonLoader
