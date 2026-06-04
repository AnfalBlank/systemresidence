// Thin fetch wrapper around the backend REST API.
// Handles base URL, auth token injection, and error normalisation.

const TOKEN_KEY = 'kstp.token'

const baseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, string | number | undefined>
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { body, query, headers, ...rest } = opts
  let url = `${baseUrl}/api${path}`
  if (query) {
    const qs = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) qs.append(k, String(v))
    })
    if (qs.toString()) url += `?${qs.toString()}`
  }

  const token = getToken()
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.error ?? res.statusText ?? 'Request failed'
    throw new ApiError(message, res.status, data?.details)
  }
  return data as T
}

export const api = {
  get: <T>(path: string, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
