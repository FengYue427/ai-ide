import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const srcPath = path.join(root, 'src', 'styles.css')
const lines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/)

const chunks = [
  ['tokens.css', 0, 35],
  ['base.css', 36, 70],
  ['toolbar.css', 71, 205],
  ['workspace.css', 206, 308],
  ['editor.css', 309, 638],
  ['panels.css', 639, 759],
  ['chat.css', 760, 847],
  ['overlays.css', 848, 1127],
  ['responsive.css', 1128, lines.length],
]

const dir = path.join(root, 'src', 'styles')
fs.mkdirSync(dir, { recursive: true })

for (const [name, start, end] of chunks) {
  const body = `${lines.slice(start, end).join('\n').trimEnd()}\n`
  fs.writeFileSync(path.join(dir, name), body)
}

const imports = chunks.map(([name]) => `@import './${name}';`).join('\n')
fs.writeFileSync(path.join(dir, 'index.css'), `${imports}\n`)

console.log(`Split ${chunks.length} modules from ${lines.length} lines`)
