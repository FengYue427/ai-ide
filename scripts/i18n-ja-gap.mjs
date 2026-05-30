import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(__dirname, '../src/i18n/translations.ts'), 'utf8')
const enBlock = src.split("'en-US':")[1].split('\n  },\n} as const')[0]
const lineRe = /^\s+'([^']+)':\s*'((?:\\'|[^'])*)',?\s*$/gm
const enMap = {}
for (const match of enBlock.matchAll(lineRe)) {
  enMap[match[1]] = match[1].includes('subscription.unit') ? match[2] : match[2].replace(/\\'/g, "'")
}

const jaSrc = [
  fs.readFileSync(path.join(__dirname, '../src/i18n/translationsJa.ts'), 'utf8'),
  fs.readFileSync(path.join(__dirname, '../src/i18n/translationsJaBulk.ts'), 'utf8'),
].join('\n')
const jaKeys = new Set([...jaSrc.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]))

const prefixes = [
  'settings.',
  'subscription.',
  'collab.',
  'auth.',
  'welcome.',
  'toolbar.',
  'command.',
  'chat.',
  'agent.',
]

for (const prefix of prefixes) {
  const keys = Object.keys(enMap)
    .filter((k) => k.startsWith(prefix))
    .sort()
  const missing = keys.filter((k) => !jaKeys.has(k))
  console.log(`${prefix} total=${keys.length} ja=${keys.length - missing.length} missing=${missing.length}`)
}

console.log('total ja overrides', jaKeys.size)
