import { useMemo } from 'react'

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'code'; language: string; value: string }

function parseMessageContent(content: string): Segment[] {
  const segments: Segment[] = []
  const re = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: content.slice(lastIndex, match.index) })
    }
    segments.push({
      kind: 'code',
      language: match[1] || 'text',
      value: match[2].trimEnd(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: 'text', value: content.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ kind: 'text', value: content })
  }

  return segments
}

type ChatMessageBodyProps = {
  content: string
  variant: 'user' | 'assistant'
}

export function ChatMessageBody({ content, variant }: ChatMessageBodyProps) {
  const segments = useMemo(() => parseMessageContent(content), [content])

  return (
    <div className={`chat-msg-body chat-msg-body--${variant}`}>
      {segments.map((segment, index) => {
        if (segment.kind === 'code') {
          return (
            <pre key={`code-${index}`} className="chat-code-block">
              {segment.language !== 'text' ? (
                <div className="chat-code-block__lang">{segment.language}</div>
              ) : null}
              <code>{segment.value}</code>
            </pre>
          )
        }
        return (
          <div key={`text-${index}`} className="chat-msg-text">
            {segment.value.split('\n').map((line, lineIndex) => (
              <div key={lineIndex}>{line || '\u00a0'}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
