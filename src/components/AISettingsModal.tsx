import React, { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { AIModel, modelOptions, defaultEndpoints } from '../services/aiService'
import { ModalShell } from './ui/ModalShell'

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
      endpoint: endpoint.trim() || defaultEndpoints[provider],
    })
  }

  return (
    <ModalShell
      className="modal--ai-settings"
      ariaLabel="AI 模型设置"
      title={
        <span className="modal-title-row">
          <Bot size={18} />
          AI 模型设置
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">AI 提供商</label>
        <div className="ai-provider-grid">
          {(Object.keys(modelOptions) as AIModel[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`ai-provider-btn ${provider === key ? 'ai-provider-btn--active' : ''}`}
              onClick={() => handleProviderChange(key)}
            >
              {modelOptions[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">模型</label>
        <select className="form-input" value={model} onChange={(e) => setModel(e.target.value)}>
          {modelOptions[provider].models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {modelOptions[provider].needsKey && (
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input
            type="password"
            className="form-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === 'openai' || provider === 'deepseek' ? 'sk-...' : 'your-api-key'
            }
          />
          <span className="form-hint">API Key 仅存储在本地浏览器中</span>
        </div>
      )}

      <button
        type="button"
        className="ai-advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <Sparkles size={12} />
        {showAdvanced ? '隐藏高级设置' : '高级设置'}
      </button>

      {showAdvanced && (
        <div className="form-group ai-advanced-block">
          <label className="form-label">自定义 API 端点 (可选)</label>
          <input
            type="text"
            className="form-input"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={defaultEndpoints[provider]}
          />
          <span className="form-hint">用于自建 API 代理或兼容 OpenAI 格式的服务</span>
        </div>
      )}
    </ModalShell>
  )
}

export default AISettingsModal
