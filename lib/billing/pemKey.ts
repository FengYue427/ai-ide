/**
 * Normalize PEM for alipay-sdk (its formatKey breaks on single-line or header-only keys).
 */
export function normalizePemKey(raw: string, defaultType: string): string {
  const text = raw.replace(/\\n/g, '\n').trim()
  if (!text) {
    throw new Error(
      '密钥为空。若写在 .env.local 多行无引号，可能只读入第一行；请用 ALIPAY_*_PATH 指向 .pem 文件，或单行用 \\n 连接。',
    )
  }

  const begin = text.match(/-----BEGIN ([^-]+)-----/)
  const end = text.match(/-----END ([^-]+)-----/)
  const type = begin?.[1]?.trim() || end?.[1]?.trim() || defaultType

  const body = text
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')

  if (!body || body.length < 32) {
    throw new Error(
      '密钥内容过短或无效。请从支付宝开放平台复制完整应用私钥与支付宝公钥，或使用 *_PATH 指向 pem 文件。',
    )
  }

  const lines = body.match(/.{1,64}/g) ?? [body]
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
}
