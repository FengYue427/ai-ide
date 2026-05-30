import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(__dirname, '../src/i18n/translations.ts'), 'utf8')
const enBlock = src.split("'en-US':")[1].split('\n  },\n} as const')[0]
const lineRe = /^\s+'([^']+)':\s*'((?:\\'|[^'])*)',?\s*$/gm
const enMap = {}
for (const match of enBlock.matchAll(lineRe)) {
  enMap[match[1]] = match[2].replace(/\\'/g, "'")
}

const jaSrc = fs.readFileSync(path.join(__dirname, '../src/i18n/translationsJa.ts'), 'utf8')
const jaKeys = new Set([...jaSrc.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]))

const prefix = process.argv[2] ?? 'chat.'
const missing = Object.keys(enMap)
  .filter((k) => k.startsWith(prefix) && !jaKeys.has(k))
  .sort()

console.log(JSON.stringify(missing.map((k) => ({ key: k, en: enMap[k] })), null, 2))
