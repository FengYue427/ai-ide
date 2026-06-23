import { memo, useMemo, type RefObject } from 'react'
import { Bot, User } from 'lucide-react'
import { AgentToolPanel } from '../AgentToolPanel'
import { ChatMessageBody } from '../ChatMessageBody'
import { ChatMessageActions } from '../ChatMessageActions'
import { useI18n } from '../../i18n'
import type { AgentActivityEntry } from '../../services/agentRunner'

export interface ChatMessageItem {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
  attachments?: import('../../lib/chatAttachments').ChatAttachmentMeta[]
}

export interface ChatMessagesListProps {
  messages: ChatMessageItem[]
  loading: boolean
  agentActivity: AgentActivityEntry[]
  messagesEndRef: RefObject<HTMLDivElement>
  onCopyMessage: (text: string) => void | Promise<void>
  onRetryFromIndex: (index: number) => void
  onContinueConversation: () => void
  onSaveRun: () => void
  onReplayLastRun: () => void
  onExportRunMarkdown: () => void
  onPromoteToSpec?: (messageIndex: number) => void
}

export const ChatMessagesList = memo(function ChatMessagesList({
  messages,
  loading,
  agentActivity,
  messagesEndRef,
  onCopyMessage,
  onRetryFromIndex,
  onContinueConversation,
  onSaveRun,
  onReplayLastRun,
  onExportRunMarkdown,
  onPromoteToSpec,
}: ChatMessagesListProps) {
  const { t } = useI18n()

  const lastAssistantIndex = useMemo(
    () =>
      messages.reduce(
        (last, item, itemIndex) => (item.role === 'assistant' ? itemIndex : last),
        -1,
      ),
    [messages],
  )

  return (
    <div className="chat-messages">
      {messages.map((message, index) => {
        const isAssistant = message.role === 'assistant'
        const isWelcome = index === 0 && isAssistant && !message.isError
        const canRetry = isAssistant && !isWelcome && !message.isError && index > 0
        const canContinue =
          isAssistant && !isWelcome && !message.isError && index === lastAssistantIndex && !loading

        const canPromote =
          !isAssistant && !message.isError && index > 0 && Boolean(onPromoteToSpec)

        return (
          <div key={index} className={`chat-msg-stack ${isAssistant ? '' : 'chat-msg-stack--user'}`}>
            <div className={`chat-msg-row ${isAssistant ? '' : 'chat-msg-row--user'}`}>
              {isAssistant && (
                <div className="chat-msg-avatar chat-msg-avatar--assistant">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`chat-msg-bubble ${isAssistant ? 'chat-msg-bubble--assistant' : 'chat-msg-bubble--user'} ${message.isError ? 'chat-msg-bubble--error' : ''}`}
              >
                <ChatMessageBody
                  content={message.content}
                  variant={message.role}
                  isError={message.isError}
                  attachments={message.attachments}
                />
              </div>

              {!isAssistant && (
                <div className="chat-msg-avatar chat-msg-avatar--user">
                  <User size={14} />
                </div>
              )}
            </div>

            {!isWelcome ? (
              <ChatMessageActions
                role={message.role}
                canRetry={canRetry}
                canContinue={canContinue}
                canPromote={canPromote}
                onCopy={() => void onCopyMessage(message.content)}
                onRetry={canRetry ? () => onRetryFromIndex(index) : undefined}
                onContinue={canContinue ? onContinueConversation : undefined}
                onPromote={canPromote ? () => onPromoteToSpec?.(index) : undefined}
              />
            ) : null}
          </div>
        )
      })}

      {loading && (
        <div className="chat-loading-row">
          <div className="chat-msg-avatar chat-msg-avatar--assistant">
            <Bot size={14} />
          </div>
          <div className="chat-loading-bubble">
            <div className="chat-loading-bubble__inner">
              <span>{t('chat.thinking')}</span>
              <span className="typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
            <AgentToolPanel
              activity={agentActivity}
              defaultCollapsed={false}
              onSaveRun={onSaveRun}
              onReplayLastRun={onReplayLastRun}
              onExportMarkdown={onExportRunMarkdown}
            />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
})
