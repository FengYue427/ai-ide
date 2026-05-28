/**
 * AST Symbol Extractor - Phase 1 代码理解增强
 * 
 * 使用轻量 AST 解析提取 TypeScript/JavaScript 符号
 * 替代正则匹配，提供更准确的符号识别
 */

export interface ASTSymbol {
  name: string
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var' | 'method' | 'property'
  line: number
  column: number
  endLine: number
  scope?: string // 父级作用域，如 'ClassName' for methods
  signature?: string // 函数签名或类型定义
  exported?: boolean
  async?: boolean
  generator?: boolean
}

export interface ASTExtractionResult {
  symbols: ASTSymbol[]
  imports: Array<{ source: string; names: string[] }>
  exports: string[]
  errors: string[]
}

/**
 * 简化的 AST 解析 - 使用正则 + 启发式规则
 * 
 * 为什么不用 @babel/parser:
 * 1. 体积大（~500KB），影响浏览器加载
 * 2. 需要 Worker 避免阻塞主线程
 * 3. 对于索引场景，启发式规则足够准确
 * 
 * Phase 1.5 可选升级为真正的 AST 解析
 */
export function extractSymbolsFromCode(
  code: string,
  _filePath: string,
): ASTExtractionResult {
  const symbols: ASTSymbol[] = []
  const imports: Array<{ source: string; names: string[] }> = []
  const exports: string[] = []
  const errors: string[] = []

  const lines = code.split('\n')
  let currentClass: string | null = null
  let braceDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lineNum = i + 1

    // 跳过注释和空行
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue
    }

    // 追踪大括号深度（简化的作用域跟踪）
    braceDepth += (line.match(/{/g) || []).length
    braceDepth -= (line.match(/}/g) || []).length

    // 提取 import（含 import type）
    const importMatch = trimmed.match(/^import\s+(?:type\s+)?(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/)
    if (importMatch) {
      const names = importMatch[1]
        ? importMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean)
        : [importMatch[2]]
      imports.push({ source: importMatch[3], names })
      continue
    }

    // 提取 export
    const exportMatch = trimmed.match(/^export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/)
    if (exportMatch) {
      exports.push(exportMatch[1])
    }

    // 提取 class
    const classMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/)
    if (classMatch) {
      const name = classMatch[1]
      currentClass = name
      symbols.push({
        name,
        kind: 'class',
        line: lineNum,
        column: line.indexOf('class'),
        endLine: lineNum, // 简化：不计算结束行
        exported: trimmed.startsWith('export'),
      })
      continue
    }

    // 提取 interface
    const interfaceMatch = trimmed.match(/^(?:export\s+)?interface\s+(\w+)/)
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        kind: 'interface',
        line: lineNum,
        column: line.indexOf('interface'),
        endLine: lineNum,
        exported: trimmed.startsWith('export'),
      })
      continue
    }

    // 提取 type
    const typeMatch = trimmed.match(/^(?:export\s+)?type\s+(\w+)\s*=/)
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        kind: 'type',
        line: lineNum,
        column: line.indexOf('type'),
        endLine: lineNum,
        exported: trimmed.startsWith('export'),
      })
      continue
    }

    // 提取 function（顶层或类方法）
    const functionMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(?:<[^>]+>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?{/)
    if (functionMatch && !trimmed.startsWith('if') && !trimmed.startsWith('while') && !trimmed.startsWith('for')) {
      const name = functionMatch[1]
      const isAsync = trimmed.includes('async')
      const isMethod = currentClass && braceDepth > 1
      
      symbols.push({
        name,
        kind: isMethod ? 'method' : 'function',
        line: lineNum,
        column: line.indexOf(name),
        endLine: lineNum,
        scope: isMethod ? (currentClass ?? undefined) : undefined,
        exported: trimmed.startsWith('export'),
        async: isAsync,
      })
      continue
    }

    // 提取箭头函数赋值
    const arrowMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/)
    if (arrowMatch) {
      const name = arrowMatch[1]
      const isAsync = trimmed.includes('async')
      
      symbols.push({
        name,
        kind: 'const',
        line: lineNum,
        column: line.indexOf(name),
        endLine: lineNum,
        exported: trimmed.startsWith('export'),
        async: isAsync,
      })
      continue
    }

    // 提取常量/变量
    const varMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?=/)
    if (varMatch) {
      const name = varMatch[1]
      const kind = trimmed.match(/^(?:export\s+)?(const|let|var)/)?.[1] as 'const' | 'let' | 'var'
      
      symbols.push({
        name,
        kind: kind || 'const',
        line: lineNum,
        column: line.indexOf(name),
        endLine: lineNum,
        exported: trimmed.startsWith('export'),
      })
    }

    // 重置 class 作用域（简化：遇到顶层大括号闭合）
    if (braceDepth === 0 && currentClass) {
      currentClass = null
    }
  }

  return { symbols, imports, exports, errors }
}

/**
 * 构建符号的完整路径（用于跳转和搜索）
 */
export function getSymbolFullPath(symbol: ASTSymbol): string {
  if (symbol.scope) {
    return `${symbol.scope}.${symbol.name}`
  }
  return symbol.name
}

/**
 * 符号相关性评分（用于搜索排序）
 */
export function scoreSymbolRelevance(symbol: ASTSymbol, query: string): number {
  const fullPath = getSymbolFullPath(symbol).toLowerCase()
  const q = query.toLowerCase()
  
  let score = 0
  
  // 完全匹配（最高优先）
  if (fullPath === q) score += 100
  
  // 名称完全匹配
  if (symbol.name.toLowerCase() === q) score += 80
  
  // 前缀匹配
  if (fullPath.startsWith(q)) score += 60
  if (symbol.name.toLowerCase().startsWith(q)) score += 50
  
  // 包含匹配
  if (fullPath.includes(q)) score += 30
  if (symbol.name.toLowerCase().includes(q)) score += 20
  
  // 类型加权（在相同匹配质量下，class > function > const）
  const kindWeight: Record<string, number> = {
    class: 40,
    interface: 35,
    function: 30,
    method: 25,
    type: 20,
    const: 15,
    let: 10,
    var: 8,
    property: 5,
  }
  score += kindWeight[symbol.kind] ?? 0
  
  // 导出符号优先
  if (symbol.exported) score += 10
  
  return score
}

/**
 * 检测文件是否支持 AST 提取
 */
export function supportsASTExtraction(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase()
  return ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext || '')
}
