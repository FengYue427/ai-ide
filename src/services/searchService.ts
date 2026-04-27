import Fuse from 'fuse.js'

export interface SearchResult {
  file: string
  line: number
  column: number
  content: string
  match: string
}

export interface FileContent {
  name: string
  content: string
}

export function searchInFiles(
  files: FileContent[],
  query: string,
  options: {
    caseSensitive?: boolean
    wholeWord?: boolean
    regex?: boolean
  } = {}
): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []

  for (const file of files) {
    const lines = file.content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1
      
      let matches: { start: number; end: number }[] = []
      
      if (options.regex) {
        try {
          const flags = options.caseSensitive ? 'g' : 'gi'
          const regex = new RegExp(query, flags)
          let match
          while ((match = regex.exec(line)) !== null) {
            matches.push({ start: match.index, end: match.index + match[0].length })
          }
        } catch {
          // Invalid regex, fall through to normal search
        }
      } else {
        const searchLine = options.caseSensitive ? line : line.toLowerCase()
        const searchQuery = options.caseSensitive ? query : query.toLowerCase()
        
        let index = 0
        while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
          const end = index + searchQuery.length
          if (options.wholeWord) {
            const before = index > 0 ? searchLine[index - 1] : ' '
            const after = end < searchLine.length ? searchLine[end] : ' '
            if (/\w/.test(before) || /\w/.test(after)) {
              index = end
              continue
            }
          }
          matches.push({ start: index, end })
          index = end
        }
      }

      for (const match of matches) {
        results.push({
          file: file.name,
          line: lineNumber,
          column: match.start + 1,
          content: line.trim(),
          match: line.slice(match.start, match.end)
        })
      }
    }
  }

  return results
}

export function fuzzySearchFiles(
  files: FileContent[],
  query: string
): SearchResult[] {
  if (!query.trim()) return []

  const fuseOptions = {
    keys: ['name', 'content'],
    threshold: 0.4,
    includeScore: true
  }

  const fuse = new Fuse(files, fuseOptions)
  const results = fuse.search(query)

  return results.map(result => {
    const file = result.item
    // 找到匹配的行
    const lines = file.content.split('\n')
    let bestLine = 1
    let bestScore = Infinity

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(query.toLowerCase())) {
        const score = Math.abs(i - lines.length / 2) // 优先中间行
        if (score < bestScore) {
          bestScore = score
          bestLine = i + 1
        }
      }
    }

    return {
      file: file.name,
      line: bestLine,
      column: 1,
      content: lines[bestLine - 1]?.trim() || '',
      match: query
    }
  })
}

export function replaceInFile(
  content: string,
  search: string,
  replace: string,
  options: {
    caseSensitive?: boolean
    wholeWord?: boolean
    regex?: boolean
  } = {}
): string {
  if (options.regex) {
    try {
      const flags = options.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(search, flags)
      return content.replace(regex, replace)
    } catch {
      return content
    }
  }

  if (options.wholeWord) {
    const flags = options.caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(`\\b${escapeRegExp(search)}\\b`, flags)
    return content.replace(regex, replace)
  }

  if (options.caseSensitive) {
    return content.split(search).join(replace)
  }

  return content.replace(new RegExp(escapeRegExp(search), 'gi'), replace)
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getFileOutline(content: string): { name: string; line: number; type: 'function' | 'class' | 'variable' }[] {
  const outline: { name: string; line: number; type: 'function' | 'class' | 'variable' }[] = []
  const lines = content.split('\n')

  // 匹配函数、类、变量定义
  const patterns = [
    { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'function' as const },
    { regex: /^(?:export\s+)?class\s+(\w+)/, type: 'class' as const },
    { regex: /^(?:export\s+)?const\s+(\w+)\s*[=:]/, type: 'variable' as const },
    { regex: /^(?:export\s+)?let\s+(\w+)\s*=/, type: 'variable' as const },
    { regex: /^(?:export\s+)?var\s+(\w+)\s*=/, type: 'variable' as const },
    { regex: /^(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*=>/, type: 'function' as const },
    { regex: /^(\w+)\s*[=:]\s*function\s*\(/, type: 'function' as const }
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    for (const { regex, type } of patterns) {
      const match = line.match(regex)
      if (match) {
        outline.push({ name: match[1], line: i + 1, type })
        break
      }
    }
  }

  return outline
}
