import { describe, it, expect } from 'vitest'
import {
  extractSymbolsFromCode,
  getSymbolFullPath,
  scoreSymbolRelevance,
  supportsASTExtraction,
  type ASTSymbol,
} from './astSymbolExtractor'

describe('astSymbolExtractor', () => {
  describe('extractSymbolsFromCode', () => {
    it('should extract class declarations', () => {
      const code = `
export class UserService {
  constructor() {}
}

class PrivateHelper {
  method() {}
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      const classes = result.symbols.filter(s => s.kind === 'class')
      expect(classes).toHaveLength(2)
      expect(classes[0].name).toBe('UserService')
      expect(classes[0].exported).toBe(true)
      expect(classes[1].name).toBe('PrivateHelper')
      expect(classes[1].exported).toBe(false)
    })

    it('should extract function declarations', () => {
      const code = `
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

async function fetchData() {
  return await fetch('/api/data')
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      const functions = result.symbols.filter(s => s.kind === 'function')
      expect(functions).toHaveLength(2)
      expect(functions[0].name).toBe('calculateTotal')
      expect(functions[0].exported).toBe(true)
      expect(functions[1].name).toBe('fetchData')
      expect(functions[1].async).toBe(true)
    })

    it('should extract arrow function constants', () => {
      const code = `
export const handleClick = (event: MouseEvent) => {
  console.log(event)
}

const processData = async (data: Data) => {
  return transform(data)
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      const consts = result.symbols.filter(s => s.kind === 'const')
      expect(consts).toHaveLength(2)
      expect(consts[0].name).toBe('handleClick')
      expect(consts[1].name).toBe('processData')
      expect(consts[1].async).toBe(true)
    })

    it('should extract interface and type declarations', () => {
      const code = `
export interface User {
  id: string
  name: string
}

type Status = 'active' | 'inactive'

export type Config = {
  apiKey: string
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      const interfaces = result.symbols.filter(s => s.kind === 'interface')
      expect(interfaces).toHaveLength(1)
      expect(interfaces[0].name).toBe('User')
      
      const types = result.symbols.filter(s => s.kind === 'type')
      expect(types).toHaveLength(2)
      expect(types[0].name).toBe('Status')
      expect(types[1].name).toBe('Config')
    })

    it('should extract class methods with scope', () => {
      const code = `
class Calculator {
  add(a: number, b: number) {
    return a + b
  }
  
  async multiply(a: number, b: number) {
    return a * b
  }
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      const methods = result.symbols.filter(s => s.kind === 'method')
      expect(methods).toHaveLength(2)
      expect(methods[0].name).toBe('add')
      expect(methods[0].scope).toBe('Calculator')
      expect(methods[1].name).toBe('multiply')
      expect(methods[1].scope).toBe('Calculator')
      expect(methods[1].async).toBe(true)
    })

    it('should extract imports', () => {
      const code = `
import { useState, useEffect } from 'react'
import React from 'react'
import type { User } from './types'
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      expect(result.imports).toHaveLength(3)
      expect(result.imports[0].source).toBe('react')
      expect(result.imports[0].names).toContain('useState')
      expect(result.imports[0].names).toContain('useEffect')
      expect(result.imports[1].names).toContain('React')
    })

    it('should track exports', () => {
      const code = `
export const API_URL = 'https://api.example.com'
export function helper() {}
export class Service {}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      expect(result.exports).toHaveLength(3)
      expect(result.exports).toContain('API_URL')
      expect(result.exports).toContain('helper')
      expect(result.exports).toContain('Service')
    })

    it('should handle complex real-world code', () => {
      const code = `
import { create } from 'zustand'

export interface IDEState {
  files: FileItem[]
  activeFile: number
  setFiles: (files: FileItem[]) => void
}

export const useIDEStore = create<IDEState>()((set) => ({
  files: [],
  activeFile: 0,
  setFiles: (files) => set({ files }),
}))

export function formatCode(code: string): string {
  return code.trim()
}
`
      const result = extractSymbolsFromCode(code, 'test.ts')
      
      expect(result.symbols.length).toBeGreaterThan(0)
      expect(result.symbols.some(s => s.name === 'IDEState')).toBe(true)
      expect(result.symbols.some(s => s.name === 'useIDEStore')).toBe(true)
      expect(result.symbols.some(s => s.name === 'formatCode')).toBe(true)
    })
  })

  describe('getSymbolFullPath', () => {
    it('should return name for top-level symbols', () => {
      const symbol: ASTSymbol = {
        name: 'myFunction',
        kind: 'function',
        line: 1,
        column: 0,
        endLine: 1,
      }
      expect(getSymbolFullPath(symbol)).toBe('myFunction')
    })

    it('should return scoped path for methods', () => {
      const symbol: ASTSymbol = {
        name: 'calculate',
        kind: 'method',
        line: 5,
        column: 2,
        endLine: 5,
        scope: 'Calculator',
      }
      expect(getSymbolFullPath(symbol)).toBe('Calculator.calculate')
    })
  })

  describe('scoreSymbolRelevance', () => {
    const symbols: ASTSymbol[] = [
      { name: 'UserService', kind: 'class', line: 1, column: 0, endLine: 1, exported: true },
      { name: 'user', kind: 'const', line: 10, column: 0, endLine: 10 },
      { name: 'getUser', kind: 'function', line: 15, column: 0, endLine: 15, exported: true },
      { name: 'fetchUserData', kind: 'function', line: 20, column: 0, endLine: 20 },
    ]

    it('should score exact matches highest', () => {
      const scores = symbols.map(s => scoreSymbolRelevance(s, 'UserService'))
      expect(scores[0]).toBeGreaterThan(scores[1])
      expect(scores[0]).toBeGreaterThan(scores[2])
    })

    it('should prefer prefix matches', () => {
      const scores = symbols.map(s => scoreSymbolRelevance(s, 'user'))
      expect(scores[1]).toBeGreaterThan(scores[3]) // 'user' > 'fetchUserData'
    })

    it('should weight exported symbols higher', () => {
      const score1 = scoreSymbolRelevance(symbols[2], 'getUser') // exported
      const score2 = scoreSymbolRelevance(symbols[3], 'fetchUserData') // not exported
      expect(score1).toBeGreaterThan(score2)
    })

    it('should weight classes higher than variables when match quality is equal', () => {
      // 'userservice' 对 UserService(class) 是精确匹配，对 user(const) 是前缀匹配
      // class 的 kindWeight 更高，所以 class 应该排在前面
      const classScore = scoreSymbolRelevance(symbols[0], 'userservice')
      const constScore = scoreSymbolRelevance(symbols[1], 'userservice')
      expect(classScore).toBeGreaterThan(constScore)
    })
  })

  describe('supportsASTExtraction', () => {
    it('should support TypeScript files', () => {
      expect(supportsASTExtraction('file.ts')).toBe(true)
      expect(supportsASTExtraction('file.tsx')).toBe(true)
    })

    it('should support JavaScript files', () => {
      expect(supportsASTExtraction('file.js')).toBe(true)
      expect(supportsASTExtraction('file.jsx')).toBe(true)
      expect(supportsASTExtraction('file.mjs')).toBe(true)
      expect(supportsASTExtraction('file.cjs')).toBe(true)
    })

    it('should not support other file types', () => {
      expect(supportsASTExtraction('file.css')).toBe(false)
      expect(supportsASTExtraction('file.json')).toBe(false)
      expect(supportsASTExtraction('file.md')).toBe(false)
    })
  })
})
