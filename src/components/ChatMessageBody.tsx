import { useCallback, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  parseInlineMarkdown,
  parseMarkdownBlocks,
  splitMessageSegments,
  type InlineNode,
  type MarkdownBlock,
} from '../lib/chatMarkdownLite'
import type { ChatAttachmentMeta } from '../lib/chatAttachments'

type ChatMessageBodyProps = {
  content: string
  variant: 'user' | 'assistant'
  isError?: boolean
  attachments?: ChatAttachmentMeta[]
}

function InlineContent({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === 'strong') {
          return <strong key={index}>{node.value}</strong>
        }
        if (node.kind === 'em') {
          return <em key={index}>{node.value}</em>
        }
        if (node.kind === 'code') {
          return (
            <code key={index} className="chat-inline-code">
              {node.value}
            </code>
          )
        }
        if (node.kind === 'link') {
          return (
            <a key={index} href={node.href} target="_blank" rel="noreferrer" className="chat-inline-link">
              {node.label}
            </a>
          )
        }
        return <span key={index}>{node.value}</span>
      })}
    </>
  )
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.kind === 'heading') {
    return (
      <div
        className={`chat-md-heading chat-md-heading--${block.level}`}
        role="heading"
        aria-level={block.level}
      >
        <InlineContent nodes={parseInlineMarkdown(block.text)} />
      </div>
    )
  }

  if (block.kind === 'ul') {
    return (
      <ul className="chat-md-list">
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineContent nodes={parseInlineMarkdown(item)} />
          </li>
        ))}
      </ul>
    )
  }

  if (block.kind === 'ol') {
    return (
      <ol className="chat-md-list chat-md-list--ordered">
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineContent nodes={parseInlineMarkdown(item)} />
          </li>
        ))}
      </ol>
    )
  }

  if (block.kind === 'blockquote') {
    return (
      <blockquote className="chat-md-quote">
        {block.lines.map((line, index) => (
          <p key={index}>
            <InlineContent nodes={parseInlineMarkdown(line)} />
          </p>
        ))}
      </blockquote>
    )
  }

  if (block.kind === 'table') {
    return (
      <div className="chat-md-table-wrap">
        <table className="chat-md-table">
          <thead>
            <tr>
              {block.headers.map((cell, index) => (
                <th key={index}>
                  <InlineContent nodes={parseInlineMarkdown(cell)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    <InlineContent nodes={parseInlineMarkdown(cell)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="chat-msg-text">
      {block.lines.map((line, index) => (
        <p key={index}>
          <InlineContent nodes={parseInlineMarkdown(line)} />
        </p>
      ))}
    </div>
  )
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore clipboard failures
    }
  }, [value])

  return (
    <pre className="chat-code-block">
      <div className="chat-code-block__toolbar">
        {language !== 'text' ? <span className="chat-code-block__lang">{language}</span> : <span />}
        <button type="button" className="chat-code-block__copy" onClick={onCopy} title={t('chat.action.copyCode')}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? t('chat.action.copied') : t('chat.action.copy')}</span>
        </button>
      </div>
      <code>{value}</code>
    </pre>
  )
}

export function ChatMessageBody({ content, variant, isError, attachments }: ChatMessageBodyProps) {
  const segments = useMemo(() => splitMessageSegments(content), [content])

  return (
    <div className={`chat-msg-body chat-msg-body--${variant} ${isError ? 'chat-msg-body--error' : ''}`}>
      {attachments && attachments.length > 0 ? (
        <div className="chat-msg-attachments">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="chat-msg-attachment" title={attachment.name}>
              {attachment.previewDataUrl ? (
                <img src={attachment.previewDataUrl} alt={attachment.name} className="chat-msg-attachment__img" />
              ) : (
                <span className="chat-msg-attachment__file">{attachment.name}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {segments.map((segment, index) => {
        if (segment.kind === 'code') {
          return <CodeBlock key={`code-${index}`} language={segment.language} value={segment.value} />
        }
        const blocks = parseMarkdownBlocks(segment.value)
        return (
          <div key={`text-${index}`} className="chat-md-root">
            {blocks.map((block, blockIndex) => (
              <MarkdownBlockView key={blockIndex} block={block} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
