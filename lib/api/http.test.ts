import { describe, expect, it } from 'vitest'
import { errorResponse, jsonResponse } from './http'

describe('api/http', () => {
  it('jsonResponse returns JSON body', async () => {
    const res = jsonResponse({ ok: true }, 200)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })

  it('errorResponse sets error message', async () => {
    const res = errorResponse('bad request', 400)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('bad request')
  })
})
