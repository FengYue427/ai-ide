import React, { useState } from 'react'
import { X, Bot, Sparkles } from 'lucide-react'
import { AIModel, modelOptions, defaultEndpoints } from '../services/aiService'

interface AISettingsModalProps {
  config: {
    provider: AIModel
    apiKey: string
    model: string
    endpoint: string
  }
  onSave: (config: { provider: AIModel; apiKey: string; model: string; endpoint: string }) => void
  onClose: () => void
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ config, onSave, onClose }) => {
  const [provider, setProvider] = useState<AIModel>(config.provider || 'openai')
  const [apiKey, setApiKey] = useState(config.apiKey || '')
  const [model, setModel] = useState(config.model || modelOptions.openai.models[0])
  const [endpoint, setEndpoint] = useState(config.endpoint || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleProviderChange = (newProvider: AIModel) => {
    setProvider(newProvider)
    setModel(modelOptions[newProvider].models[0])
    setEndpoint('')
  }

  const handleSave = () => {
    onSave({
      provider,
      apiKey,
      model,
      endpoint: endpoint.trim() || defaultEndpoints[provider]
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={18} />
            AI 模型设置
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">AI 提供商</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(Object.keys(modelOptions) as AIModel[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  style={{
                    padding: '10px',
                    background: provider === key ? 'var(--accent-color)' : 'var(--bg-primary)',
                    color: provider === key ? 'var(--bg-primary)' : 'var(--text-primary)',
                    border: `1px solid ${provider === key ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  {modelOptions[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">模型</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)'
              }}
            >
              {modelOptions[provider].models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {modelOptions[provider].needsKey && (
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : provider === 'deepseek' ? 'sk-...' : 'your-api-key'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)'
                }}
              />
              <span className="form-hint">
                API Key 仅存储在本地浏览器中
              </span>
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={12} />
              {showAdvanced ? '隐藏高级设置' : '高级设置'}
            </button>
          </div>

          {showAdvanced && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">自定义 API 端点 (可选)</label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={defaultEndpoints[provider]}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)'
                }}
              />
              <span className="form-hint">
                用于自建 API 代理或兼容 OpenAI 格式的服务
              </span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default AISettingsModal
