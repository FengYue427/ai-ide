import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy, Radio, Share2, Users } from 'lucide-react'
import { useI18n } from '../i18n'
import { isCollabM1Enabled } from '../lib/collabM1Features'
import { authService } from '../services/authService'
import { createCollabRoom, joinCollabRoom } from '../services/collabRoomsApiService'
import { collaborationService } from '../services/collaborationService'
import { StorageLayer, unifiedStorage } from '../services/unifiedStorage'
import { useIDEStore } from '../store/ideStore'
import { ModalShell } from './ui/ModalShell'

interface CollaborationPanelProps {
  onClose: () => void
}

const COLLAB_USERNAME_KEY = 'collab-username'

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const { t } = useI18n()
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [joined, setJoined] = useState(false)
  const [users, setUsers] = useState<{ user?: { name?: string; color?: string } }[]>([])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collabM1 = isCollabM1Enabled()

  useEffect(() => {
    unifiedStorage.get<string>(COLLAB_USERNAME_KEY, '').then((saved) => {
      setUserName(
        saved || t('collab.defaultUser', { n: Math.floor(Math.random() * 1000) }),
      )
    })

    const roomFromUrl = new URLSearchParams(window.location.search).get('room')
    if (roomFromUrl) setRoomId(roomFromUrl)
  }, [t])

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

  const generateNewRoom = async () => {
    setError(null)
    if (collabM1) {
      if (!authService.getCurrentUser()) {
        setError(t('collab.m1.loginRequired'))
        return
      }
      setBusy(true)
      try {
        const { room, error: apiError } = await createCollabRoom(undefined, t)
        if (apiError || !room) {
          setError(apiError ?? t('collab.m1.createFailed'))
          return
        }
        setRoomId(room.code)
      } finally {
        setBusy(false)
      }
      return
    }
    setRoomId(Math.random().toString(36).substring(2, 8))
  }

  const handleJoin = async () => {
    setError(null)
    const colors = ['#58a6ff', '#33c58e', '#ffb648', '#f778ba', '#a371f7']
    const color = colors[Math.floor(Math.random() * colors.length)]
    let nextRoomId = roomId.trim()

    if (collabM1) {
      if (!authService.getCurrentUser()) {
        setError(t('collab.m1.loginRequired'))
        return
      }
      setBusy(true)
      try {
        if (!nextRoomId) {
          const created = await createCollabRoom(undefined, t)
          if (created.error || !created.room) {
            setError(created.error ?? t('collab.m1.createFailed'))
            return
          }
          nextRoomId = created.room.code
          setRoomId(nextRoomId)
        } else {
          const joined = await joinCollabRoom(nextRoomId, { t })
          if (joined.error || !joined.room) {
            setError(joined.error ?? t('collab.m1.joinFailed'))
            return
          }
          nextRoomId = joined.room.code
        }
      } finally {
        setBusy(false)
      }
    } else if (!nextRoomId) {
      nextRoomId = Math.random().toString(36).substring(2, 8)
      setRoomId(nextRoomId)
    }

    await unifiedStorage.set(COLLAB_USERNAME_KEY, userName, { layer: StorageLayer.LOCAL })

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
      ariaLabel={t('collab.aria')}
      title={
        <span className="modal-title-row">
          <Users size={18} />
          {t('collab.title')}
        </span>
      }
      onClose={onClose}
    >
      <div className="collab-hero">
        <div className="collab-hero__head">
          <div className="collab-hero__title">{t('collab.hero.title')}</div>
          <span className="collab-beta-badge">Beta</span>
        </div>
        <p className="collab-hero__desc">{t('collab.hero.desc')}</p>
        <div className="collab-limits">
          {collabM1 ? t('collab.m1.limits') : t('collab.limits')}
        </div>
      </div>

      {error ? (
        <div className="collab-error" role="alert">
          {error}
        </div>
      ) : null}

      {!joined ? (
        <div className="collab-stack">
          <div className="collab-panel">
            <div className="collab-stack">
              <div className="form-group">
                <label className="form-label">{t('collab.yourName')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('collab.roomId')}</label>
                <div className="collab-form-row">
                  <input
                    type="text"
                    className="form-input"
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    placeholder={t('collab.roomPlaceholder')}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => void generateNewRoom()}
                  >
                    {t(collabM1 ? 'collab.m1.generate' : 'collab.generate')}
                  </button>
                </div>
                <p className="collab-hint">{t('collab.hint')}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleJoin()}
            className="btn btn-primary"
            disabled={!userName.trim() || busy}
          >
            <Share2 size={14} className="btn-icon-gap" />
            {roomId ? t('collab.joinRoom') : t('collab.createRoom')}
          </button>
        </div>
      ) : (
        <div className="collab-stack">
          <div className="collab-panel">
            <div className="collab-members-title">{t('collab.roomLink')}</div>
            <div className="collab-copy-row">
              <input
                className="form-input"
                value={`${window.location.origin}?room=${roomId}`}
                readOnly
              />
              <button type="button" className="btn btn-primary" onClick={copyRoomLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="btn-icon-gap">{copied ? t('collab.copied') : t('collab.copyLink')}</span>
              </button>
            </div>
            <p className="collab-room-id">
              {t('collab.roomIdLabel')}<strong>{roomId}</strong>
            </p>
          </div>

          <div className="collab-panel">
            <div className="collab-members-title">{t('collab.members', { count: users.length })}</div>
            <div className="collab-members">
              {users.map((user, index) => (
                <div key={index} className="collab-member">
                  <span
                    className="collab-member-dot"
                    style={{ background: user.user?.color || '#58a6ff' }}
                  />
                  <span className="collab-member-name">
                    {user.user?.name || t('collab.unknownUser')}
                    {user.user?.name === userName ? t('collab.you') : ''}
                  </span>
                  <Radio size={14} color="#33c58e" />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleLeave} className="btn btn-secondary collab-leave-btn">
            {t('collab.leave')}
          </button>
        </div>
      )}
    </ModalShell>
  )
}

export default CollaborationPanel
