import { errorResponse } from './http'

export type ReadJsonResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: Response }

export async function readRequestBodyWithLimit(req: Request, maxBytes: number): Promise<Uint8Array | null> {
  const lenHeader = req.headers.get('content-length')
  if (lenHeader) {
    const parsed = Number(lenHeader)
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return null
    }
  }

  const buf = new Uint8Array(await req.arrayBuffer())
  if (buf.byteLength > maxBytes) {
    return null
  }
  return buf
}

export async function readJsonWithLimit<T>(
  req: Request,
  maxBytes: number,
  errorMessage = '请求体过大',
): Promise<ReadJsonResult<T>> {
  const buf = await readRequestBodyWithLimit(req, maxBytes)
  if (!buf) {
    return { ok: false, response: errorResponse(errorMessage, 413) }
  }
  try {
    const text = new TextDecoder().decode(buf)
    return { ok: true, value: JSON.parse(text) as T }
  } catch {
    return { ok: false, response: errorResponse('请求体不是有效 JSON', 400) }
  }
}

