import React, { useState, useEffect, useRef } from 'react'
import { X, Users, Share2, Copy, Check, Radio } from 'lucide-react'
import { collaborationService } from '../services/collaborationService'

interface CollaborationPanelProps {
  onClose: () => void
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState(() => localStorage.getItem('collab_username') || '用户' + Math.floor(Math.random() * 1000))
  const [joined, setJoined] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (joined) {
      const interval = setInterval(() => {
        const onlineUsers = collaborationService.getOnlineUsers()
        setUsers(onlineUsers)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [joined])

  // 清理 copied 状态 timer
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  const handleJoin = () => {
    if (!roomId.trim()) {
      // 生成随机房间 ID
      setRoomId(Math.random().toString(36).substring(2, 8))
      return
    }

    localStorage.setItem('collab_username', userName)
    
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#f778ba', '#a371f7']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    collaborationService.joinRoom(roomId, userName, color)
    collaborationService.on('users', (newUsers) => {
      setUsers(newUsers)
    })
    
    setJoined(true)
  }

  const handleLeave = () => {
    collaborationService.leaveRoom()
    setJoined(false)
    setUsers([])
  }

  const copyRoomLink = async () => {
    const link = `${window.location.origin}?room=${roomId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    
    // 清理之前的 timer
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current)
    }
    
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 2000)
  }

  const generateNewRoom = () => {
    setRoomId(Math.random().toString(36).substring(2, 8))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            实时协作
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>
        <div className="modal-body">
          {!joined ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">你的名字</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
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
              </div>

              <div className="form-group">
                <label className="form-label">房间 ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="留空创建新房间"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    onClick={generateNewRoom}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                  >
                    生成
                  </button>
                </div>
                <span className="form-hint">
                  输入已有房间 ID 加入，或留空创建新房间
                </span>
              </div>

              <button
                onClick={handleJoin}
                className="btn btn-primary"
                disabled={!userName.trim()}
              >
                <Share2 size={14} style={{ marginRight: '6px' }} />
                {roomId ? '加入房间' : '创建房间'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  房间 ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ 
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}>
                    {roomId}
                  </code>
                  <button
                    onClick={copyRoomLink}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? '已复制' : '复制链接'}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  在线用户 ({users.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {users.map((user, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px'
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: user.user?.color || '#58a6ff'
                        }}
                      />
                      <span style={{ fontSize: '13px' }}>
                        {user.user?.name || '未知用户'}
                        {user.user?.name === userName && ' (你)'}
                      </span>
                      <Radio size={12} style={{ marginLeft: 'auto', color: '#3fb950' }} />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLeave}
                className="btn btn-secondary"
                style={{ borderColor: '#f85149', color: '#f85149' }}
              >
                离开房间
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborationPanel
