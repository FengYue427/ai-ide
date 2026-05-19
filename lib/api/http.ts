export function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export function errorResponse(message: string, status = 400, headers?: Record<string, string>) {
  return jsonResponse({ error: message }, status, headers)
}
