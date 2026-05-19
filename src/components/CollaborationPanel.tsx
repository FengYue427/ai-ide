import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, Radio, Share2, Users, X } from 'lucide-react'
import { collaborationService } from '../services/collaborationService'
import { StorageLayer, unifiedStorage } from '../services/unifiedStorage'
import { useIDEStore } from '../store/ideStore'

interface CollaborationPanelProps {
  onClose: () => void
}

const COLLAB_USERNAME_KEY = 'collab-username'

const cardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState(`用户${Math.floor(Math.random() * 1000)}`)
  const [joined, setJoined] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    unifiedStorage.get<string>(COLLAB_USERNAME_KEY, '').then((saved) => {
      if (saved) setUserName(saved)
    })

    const roomFromUrl = new URLSearchParams(window.location.search).get('room')
    if (roomFromUrl) setRoomId(roomFromUrl)
  }, [])

  useEffect(() => {
    if (joined) {
      const interval = setInterval(() => {
        setUsers(collaborationService.getOnlineUsers())
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [joined])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const generateNewRoom = () => {
    setRoomId(Math.random().toString(36).substring(2, 8))
  }

  const handleJoin = async () => {
    const nextRoomId = roomId.trim() || Math.random().toString(36).substring(2, 8)
    if (!roomId.trim()) {
      setRoomId(nextRoomId)
    }

    await unifiedStorage.set(COLLAB_USERNAME_KEY, userName, { layer: StorageLayer.LOCAL })
    const colors = ['#58a6ff', '#33c58e', '#ffb648', '#f778ba', '#a371f7']
    const color = colors[Math.floor(Math.random() * colors.length)]

    collaborationService.joinRoom(nextRoomId, userName, color)
    collaborationService.on('users', (nextUsers) => {
      setUsers(nextUsers as typeof users)
    })
    useIDEStore.getState().setCollaborationRoomId(nextRoomId)
    setJoined(true)
  }

  const handleLeave = () => {
    collaborationService.leaveRoom()
    useIDEStore.getState().setCollaborationRoomId(null)
    setJoined(false)
    setUsers([])
  }

  const copyRoomLink = async () => {
    const link = `${window.location.origin}?room=${roomId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 1800)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '620px', maxWidth: '92vw' }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            实时协作
          </span>
          <div className="modal-close" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="modal-body" style={{ display: 'grid', gap: '16px' }}>
          <div
            style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.10), transparent 75%)',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>和别人一起盯着同一个工作区</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              创建房间或加入已有房间。加入后当前工作区文件会通过 Yjs 同步（实验性）。
            </div>
          </div>

          {!joined ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label className="form-label">你的名字</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(event) => setUserName(event.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label">房间 ID</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(event) => setRoomId(event.target.value)}
                        placeholder="留空则自动创建一个新房间"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                        }}
                      />
                      <button className="btn btn-secondary" onClick={generateNewRoom}>
                        生成
                      </button>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      输入已有房间 ID 加入，或者留空后直接创建新房间。
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button onClick={handleJoin} className="btn btn-primary" disabled={!userName.trim()}>
                  <Share2 size={14} style={{ marginRight: '6px' }} />
                  {roomId ? '加入房间' : '创建房间'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={cardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px' }}>房间链接</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <input
                    value={`${window.location.origin}?room=${roomId}`}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                  <button className="btn btn-primary" onClick={copyRoomLink}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span style={{ marginLeft: '6px' }}>{copied ? '已复制' : '复制链接'}</span>
                  </button>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  房间 ID：<strong style={{ color: 'var(--text-primary)' }}>{roomId}</strong>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '10px' }}>
                  在线成员（{users.length}）
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {users.map((user, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '12px 1fr auto',
                        gap: '10px',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '999px',
                          background: user.user?.color || '#58a6ff',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {user.user?.name || '未知用户'}
                        {user.user?.name === userName ? '（你）' : ''}
                      </span>
                      <Radio size={14} color="#33c58e" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button onClick={handleLeave} className="btn btn-secondary" style={{ borderColor: '#ff7b72', color: '#ff7b72' }}>
                  离开房间
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborationPanel
