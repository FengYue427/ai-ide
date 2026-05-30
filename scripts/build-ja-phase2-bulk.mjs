import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const WORDS = [
  ['Settings Center', '設定センター'],
  ['Command palette', 'コマンドパレット'],
  ['Command Palette', 'コマンドパレット'],
  ['Background job', 'バックグラウンドジョブ'],
  ['Background Job', 'バックグラウンドジョブ'],
  ['Quick start', 'クイックスタート'],
  ['Sign in', 'サインイン'],
  ['Sign out', 'サインアウト'],
  ['Signed in', 'サインイン'],
  ['Try again', '再試行'],
  ['Not ready', '未準備'],
  ['Read-only', '閲覧専用'],
  ['read-only', '閲覧専用'],
  ['Settings', '設定'],
  ['Setting', '設定'],
  ['Workspace', 'ワークスペース'],
  ['workspaces', 'ワークスペース'],
  ['workspace', 'ワークスペース'],
  ['Background', 'バックグラウンド'],
  ['Subscription', 'サブスクリプション'],
  ['subscription', 'サブスクリプション'],
  ['Collaboration', 'コラボレーション'],
  ['collaboration', 'コラボレーション'],
  ['Collaborate', 'コラボ'],
  ['Terminal', 'ターミナル'],
  ['Template', 'テンプレート'],
  ['template', 'テンプレート'],
  ['Preview', 'プレビュー'],
  ['Search', '検索'],
  ['Import', 'インポート'],
  ['Export', 'エクスポート'],
  ['Delete', '削除'],
  ['Remove', '削除'],
  ['Cancel', 'キャンセル'],
  ['Close', '閉じる'],
  ['Saved', '保存済み'],
  ['Failed', '失敗'],
  ['failed', '失敗'],
  ['Success', '成功'],
  ['success', '成功'],
  ['Loading', '読み込み中'],
  ['loading', '読み込み中'],
  ['Running', '実行中'],
  ['running', '実行中'],
  ['Running', '実行中'],
  ['Code', 'コード'],
  ['code', 'コード'],
  ['Files', 'ファイル'],
  ['files', 'ファイル'],
  ['File', 'ファイル'],
  ['file', 'ファイル'],
  ['Folder', 'フォルダー'],
  ['Project', 'プロジェクト'],
  ['project', 'プロジェクト'],
  ['Account', 'アカウント'],
  ['account', 'アカウント'],
  ['Password', 'パスワード'],
  ['Email', 'メール'],
  ['Register', '登録'],
  ['Registration', '登録'],
  ['Upgrade', 'アップグレード'],
  ['upgrade', 'アップグレード'],
  ['Payment', '支払い'],
  ['payment', '支払い'],
  ['Checkout', 'チェックアウト'],
  ['Quota', 'クォータ'],
  ['quota', 'クォータ'],
  ['Agent', 'エージェント'],
  ['agent', 'エージェント'],
  ['Chat', 'チャット'],
  ['chat', 'チャット'],
  ['Message', 'メッセージ'],
  ['message', 'メッセージ'],
  ['Copied', 'コピー済み'],
  ['Copy', 'コピー'],
  ['Retry', '再試行'],
  ['Continue', '続行'],
  ['Create', '作成'],
  ['Join', '参加'],
  ['Leave', '退出'],
  ['Connected', '接続済み'],
  ['Connecting', '接続中'],
  ['Disconnected', '切断'],
  ['Reconnecting', '再接続中'],
  ['Network', 'ネットワーク'],
  ['network', 'ネットワーク'],
  ['Server', 'サーバー'],
  ['server', 'サーバー'],
  ['Request', 'リクエスト'],
  ['request', 'リクエスト'],
  ['Permission', '権限'],
  ['permission', '権限'],
  ['Plugin', 'プラグイン'],
  ['plugin', 'プラグイン'],
  ['Recommended', 'おすすめ'],
  ['Unlimited', '無制限'],
  ['Storage', 'ストレージ'],
  ['storage', 'ストレージ'],
  ['Processing', '処理中'],
  ['Provider', 'プロバイダー'],
  ['provider', 'プロバイダー'],
  ['Model', 'モデル'],
  ['model', 'モデル'],
  ['Endpoint', 'エンドポイント'],
  ['Explain', '説明'],
  ['Refactor', 'リファクタ'],
  ['Optimize', '最適化'],
  ['Generate', '生成'],
  ['Comment', 'コメント'],
  ['Simplify', '簡素化'],
  ['Streaming', 'ストリーミング'],
  ['History', '履歴'],
  ['Context', 'コンテキスト'],
  ['context', 'コンテキスト'],
  ['Semantic', 'セマンティック'],
  ['Performance', 'パフォーマンス'],
  ['Document', 'ドキュメント'],
  ['Format', 'フォーマット'],
  ['Autosave', '自動保存'],
  ['Language', '言語'],
  ['Theme', 'テーマ'],
  ['Features', '機能'],
  ['Advanced', '詳細'],
  ['Appearance', '外観'],
  ['Experimental', '実験的'],
  ['Welcome', 'ようこそ'],
  ['Shortcuts', 'ショートカット'],
  ['Privacy', 'プライバシー'],
  ['Signaling', 'シグナリング'],
  ['Refresh', '更新'],
  ['Unknown', '不明'],
  ['Online', 'オンライン'],
  ['Members', 'メンバー'],
  ['Member', 'メンバー'],
  ['Editor', 'エディタ'],
  ['Viewer', '閲覧者'],
  ['Host', 'ホスト'],
  ['Room', 'ルーム'],
  ['room', 'ルーム'],
  ['Open', '開く'],
  ['Save', '保存'],
  ['Run', '実行'],
  ['Error', 'エラー'],
  ['error', 'エラー'],
  ['Plan', 'プラン'],
  ['plan', 'プラン'],
  ['Free', '無料'],
  ['free', '無料'],
  ['Enable', '有効化'],
  ['Disable', '無効化'],
  ['Enabled', '有効'],
  ['Disabled', '無効'],
  ['Confirm', '確認'],
  ['Warning', '警告'],
  ['Details', '詳細'],
  ['Status', 'ステータス'],
  ['Ready', '準備完了'],
  ['Apply', '適用'],
  ['Reject', '拒否'],
  ['Report', 'レポート'],
  ['Queue', 'キュー'],
  ['Tool', 'ツール'],
  ['tools', 'ツール'],
  ['Log', 'ログ'],
  ['Send', '送信'],
  ['Stop', '停止'],
  ['Fix', '修正'],
  ['Terms', '利用規約'],
  ['Recent', '最近'],
  ['Current', '現在'],
  ['current', '現在'],
]

export function escapeTs(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** Gloss en-US UI/API copy to ja-JP while preserving `{params}`. */
export function glossEnToJa(en) {
  const placeholders = []
  const shielded = en.replace(/\{[^}]+\}/g, (match) => {
    placeholders.push(match)
    return `\x00${placeholders.length - 1}\x00`
  })

  const sorted = [...WORDS].sort((a, b) => b[0].length - a[0].length)
  let out = shielded
  for (const [from, to] of sorted) {
    out = out.split(from).join(to)
  }

  return out.replace(/\x00(\d+)\x00/g, (_, index) => placeholders[Number(index)])
}

function writeUiBulk(outPath, entries) {
  const lines = [
    "import type { TranslationKey } from './translations'",
    '',
    '/** Auto-generated Phase 2 bulk ja glosses (F4). Regenerate: node scripts/build-ja-phase2-bulk.mjs */',
    'export const JA_JP_BULK_OVERRIDES: Partial<Record<TranslationKey, string>> = {',
  ]
  for (const [key, value] of entries) {
    lines.push(`  '${key}': '${escapeTs(value)}',`)
  }
  lines.push('}', '')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
}

function writeApiJa(outPath, entries) {
  const lines = [
    '',
    '/** Auto-generated API ja glosses (F4). Regenerate: node scripts/build-ja-phase2-bulk.mjs */',
    'export const API_MESSAGES_JA = {',
  ]
  for (const [key, value] of entries) {
    lines.push(`  '${key}': '${escapeTs(value)}',`)
  }
  lines.push('} as const', '')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const UI_PREFIXES = [
  'settings.',
  'subscription.',
  'collab.',
  'auth.',
  'welcome.',
  'toolbar.',
  'command.',
  'chat.',
  'agent.',
  'notify.',
  'confirm.',
  'editor.',
  'sidebar.',
  'common.',
  'modal.',
  'workspace.',
  'payment.',
]

const translationsSrc = fs.readFileSync(path.join(root, 'src/i18n/translations.ts'), 'utf8')
const enBlock = translationsSrc.split("'en-US':")[1].split('\n  },\n} as const')[0]
const lineRe = /^\s+'([^']+)':\s*'((?:\\'|[^'])*)',?\s*$/gm
const enUi = {}
for (const match of enBlock.matchAll(lineRe)) {
  enUi[match[1]] = match[2].replace(/\\'/g, "'")
}

const curatedSrc = fs.readFileSync(path.join(root, 'src/i18n/translationsJa.ts'), 'utf8')
const curatedKeys = new Set([...curatedSrc.matchAll(/^\s+'([^']+)':/gm)].map((m) => m[1]))

const uiBulk = []
for (const prefix of UI_PREFIXES) {
  for (const key of Object.keys(enUi).sort()) {
    if (!key.startsWith(prefix)) continue
    if (curatedKeys.has(key)) continue
    uiBulk.push([key, glossEnToJa(enUi[key])])
  }
}

writeUiBulk(path.join(root, 'src/i18n/translationsJaBulk.ts'), uiBulk)

const apiSrc = fs.readFileSync(path.join(root, 'lib/i18n/apiMessages.ts'), 'utf8')
const apiEnBlock = apiSrc.split("'en-US':")[1].split('\n  },\n} as const')[0]
const apiEn = {}
for (const match of apiEnBlock.matchAll(lineRe)) {
  apiEn[match[1]] = match[2].replace(/\\'/g, "'")
}

const apiJa = Object.keys(apiEn)
  .sort()
  .map((key) => [key, glossEnToJa(apiEn[key])])

writeApiJa(path.join(root, 'lib/i18n/apiMessagesJa.generated.ts'), apiJa)

console.log(`UI bulk: ${uiBulk.length} keys`)
console.log(`API ja: ${apiJa.length} keys`)
