import { memo } from 'react'
import { FileText, Image as ImageIcon, X } from 'lucide-react'
import type { ChatPendingAttachment } from '../../lib/chatAttachments'

interface ChatAttachmentStripProps {
  attachments: ChatPendingAttachment[]
  onRemove: (id: string) => void
}

export const ChatAttachmentStrip = memo(function ChatAttachmentStrip({
  attachments,
  onRemove,
}: ChatAttachmentStripProps) {
  if (attachments.length === 0) return null

  return (
    <div className="chat-attachment-strip" data-testid="chat-attachment-strip">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="chat-attachment-chip" data-testid={`chat-attachment-${attachment.id}`}>
          {attachment.kind === 'image' && attachment.previewDataUrl ? (
            <img src={attachment.previewDataUrl} alt={attachment.name} className="chat-attachment-chip__thumb" />
          ) : attachment.kind === 'image' ? (
            <ImageIcon size={14} />
          ) : (
            <FileText size={14} />
          )}
          <span className="chat-attachment-chip__name" title={attachment.name}>
            {attachment.name}
          </span>
          <button
            type="button"
            className="chat-attachment-chip__remove"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remove ${attachment.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
})
