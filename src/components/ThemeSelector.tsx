import React, { useState } from 'react'
import { X, Check, Moon, Sun, Palette, Monitor } from 'lucide-react'

interface Theme {
  id: string
  name: string
  type: 'dark' | 'light' | 'system'
  colors: {
    primary: string
    accent: string
    bg: string
  }
}

const themes: Theme[] = [
  {
    id: 'vs-dark',
    name: '深色主题',
    type: 'dark',
    colors: { primary: '#1e1e1e', accent: '#0e639c', bg: '#252526' }
  },
  {
    id: 'light',
    name: '浅色主题',
    type: 'light',
    colors: { primary: '#ffffff', accent: '#007acc', bg: '#f3f3f3' }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    colors: { primary: '#272822', accent: '#a6e22e', bg: '#3e3d32' }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: { primary: '#282a36', accent: '#bd93f9', bg: '#44475a' }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    type: 'dark',
    colors: { primary: '#0d1117', accent: '#58a6ff', bg: '#161b22' }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    colors: { primary: '#ffffff', accent: '#0969da', bg: '#f6f8fa' }
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: { primary: '#2e3440', accent: '#88c0d0', bg: '#3b4252' }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    type: 'dark',
    colors: { primary: '#002b36', accent: '#268bd2', bg: '#073642' }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    type: 'light',
    colors: { primary: '#fdf6e3', accent: '#268bd2', bg: '#eee8d5' }
  }
]

interface ThemeSelectorProps {
  currentTheme: string
  onChangeTheme: (themeId: string) => void
  onClose: () => void
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onChangeTheme,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'dark' | 'light'>('all')

  const filteredThemes = themes.filter(theme => {
    if (activeTab === 'all') return true
    return theme.type === activeTab
  })

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={24} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>选择主题</h3>
          </div>
          <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'all', label: '全部', icon: <Monitor size={16} /> },
            { id: 'dark', label: '深色', icon: <Moon size={16} /> },
            { id: 'light', label: '浅色', icon: <Sun size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent-color)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Theme Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {filteredThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onChangeTheme(theme.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: `2px solid ${currentTheme === theme.id ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Color Preview */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 12px',
                    borderRadius: '8px',
                    background: theme.colors.primary,
                    border: '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '20px',
                      background: theme.colors.bg
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: theme.colors.accent
                    }}
                  />
                </div>

                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
                  {theme.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {theme.type}
                </div>

                {currentTheme === theme.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={14} style={{ color: '#fff' }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector
