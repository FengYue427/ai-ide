import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, Radio, Share2, Users } from 'lucide-react'
import { collaborationService } from '../services/collaborationService'
import { StorageLayer, unifiedStorage } from '../services/unifiedStorage'
import { useIDEStore } from '../store/ideStore'
import { ModalShell } from './ui/ModalShell'

interface CollaborationPanelProps {
  onClose: () => void
}

const COLLAB_USERNAME_KEY = 'collab-username'

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState(`用户${Math.floor(Math.random() * 1000)}`)
  const [joined, setJoined] = useState(false)
  const [users, setUsers] = useState<{ user?: { name?: string; color?: string } }[]>([])
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
        setUsers(collaborationService.getOnlineUsers() as typeof users)
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
    <ModalShell
      className="modal--collab"
      bodyClassName="modal-body--stack"
      ariaLabel="实时协作 Beta"
      title={
        <span className="modal-title-row">
          <Users size={18} />
          实时协作
        </span>
      }
      onClose={onClose}
    >
      <div className="collab-hero">
        <div className="collab-hero__head">
          <div className="collab-hero__title">和别人一起盯着同一个工作区</div>
          <span className="collab-beta-badge">Beta</span>
        </div>
        <p className="collab-hero__desc">
          创建房间或加入已有房间。加入后当前工作区文件会通过 Yjs + WebRTC 同步。
        </p>
        <div className="collab-limits">
          Beta 说明：无独立信令服务器时依赖公共 WebRTC 信令；多人同时编辑可能出现冲突，编辑器光标不同步。适合演示与小团队试用，不建议作为生产级协作方案。
        </div>
      </div>

      {!joined ? (
        <div className="collab-stack">
          <div className="collab-panel">
            <div className="collab-stack">
              <div className="form-group">
                <label className="form-label">你的名字</label>
                <input
                  type="text"
                  className="form-input"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">房间 ID</label>
                <div className="collab-form-row">
                  <input
                    type="text"
                    className="form-input"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    placeholder="留空则自动创建一个新房间"
                  />
                  <button type="button" className="btn btn-secondary" onClick={generateNewRoom}>
                    生成
                  </button>
                </div>
                <p className="collab-hint">输入已有房间 ID 加入，或者留空后直接创建新房间。</p>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleJoin} className="btn btn-primary" disabled={!userName.trim()}>
            <Share2 size={14} className="btn-icon-gap" />
            {roomId ? '加入房间' : '创建房间'}
          </button>
        </div>
      ) : (
        <div className="collab-stack">
          <div className="collab-panel">
            <div className="collab-members-title">房间链接</div>
            <div className="collab-copy-row">
              <input
                className="form-input"
                value={`${window.location.origin}?room=${roomId}`}
                readOnly
              />
              <button type="button" className="btn btn-primary" onClick={copyRoomLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="btn-icon-gap">{copied ? '已复制' : '复制链接'}</span>
              </button>
            </div>
            <p className="collab-room-id">
              房间 ID：<strong>{roomId}</strong>
            </p>
          </div>

          <div className="collab-panel">
            <div className="collab-members-title">在线成员（{users.length}）</div>
            <div className="collab-members">
              {users.map((user, index) => (
                <div key={index} className="collab-member">
                  <span
                    className="collab-member-dot"
                    style={{ background: user.user?.color || '#58a6ff' }}
                  />
                  <span className="collab-member-name">
                    {user.user?.name || '未知用户'}
                    {user.user?.name === userName ? '（你）' : ''}
                  </span>
                  <Radio size={14} color="#33c58e" />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleLeave} className="btn btn-secondary collab-leave-btn">
            离开房间
          </button>
        </div>
      )}
    </ModalShell>
  )
}

export default CollaborationPanel
