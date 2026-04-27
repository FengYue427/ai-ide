import React, { useState } from 'react'
import { X } from 'lucide-react'

interface SettingsModalProps {
  apiKey: string
  onSave: (key: string) => void
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ apiKey, onSave, onClose }) => {
  const [key, setKey] = useState(apiKey)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">设置</span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">OpenAI API Key</label>
            <input
              className="form-input"
              type="password"
              placeholder="sk-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <span className="form-hint">
              你的 API Key 仅存储在本地浏览器中，不会发送到我们的服务器。
              获取 API Key: https://platform.openai.com/api-keys
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={() => onSave(key)}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
