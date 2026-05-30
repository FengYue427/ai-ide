import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(__dirname, '../src/i18n/translations.ts'), 'utf8')
const enBlock = src.split("'en-US':")[1].split('\n  },\n} as const')[0]
const lineRe = /^\s+'([^']+)':\s*'((?:\\'|[^'])*)',?\s*$/gm
const map = {}
for (const match of enBlock.matchAll(lineRe)) {
  map[match[1]] = match[2].replace(/\\'/g, "'")
}

const prefixes = ['welcome.', 'settings.', 'collab.', 'subscription.', 'auth.', 'toolbar.']
const keys = Object.keys(map)
  .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)))
  .sort()

console.log(JSON.stringify({ count: keys.length, keys, sample: keys.slice(0, 5) }, null, 2))
