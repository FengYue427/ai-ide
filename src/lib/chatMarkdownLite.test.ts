import { describe, expect, it } from 'vitest'
import { parseInlineMarkdown, parseMarkdownBlocks, splitMessageSegments } from './chatMarkdownLite'

describe('chatMarkdownLite', () => {
  it('splits fenced code blocks', () => {
    const segments = splitMessageSegments('hello\n```ts\nconst x = 1\n```\nworld')
    expect(segments).toHaveLength(3)
    expect(segments[1]).toMatchObject({ kind: 'code', language: 'ts' })
  })

  it('parses unordered and ordered lists', () => {
    const blocks = parseMarkdownBlocks('- one\n- two\n\n1. a\n2. b')
    expect(blocks.some((b) => b.kind === 'ul')).toBe(true)
    expect(blocks.some((b) => b.kind === 'ol')).toBe(true)
  })

  it('parses blockquote and table', () => {
    const md = '> quote line\n\n| a | b |\n|---|---|\n| 1 | 2 |'
    const blocks = parseMarkdownBlocks(md)
    expect(blocks.some((b) => b.kind === 'blockquote')).toBe(true)
    expect(blocks.some((b) => b.kind === 'table')).toBe(true)
  })

  it('parses inline emphasis and links', () => {
    const nodes = parseInlineMarkdown('**bold** and [link](https://x.test)')
    expect(nodes.some((n) => n.kind === 'strong')).toBe(true)
    expect(nodes.some((n) => n.kind === 'link')).toBe(true)
  })
})
