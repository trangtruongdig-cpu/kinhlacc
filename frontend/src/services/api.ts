const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'pass',
  'pwd',
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
])
const MAX_LOG_LEN = 1500

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value
  if (depth > 12) return '[deep]'
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth))
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '***'
      } else {
        out[k] = redact(v, depth + 1)
      }
    }
    return out
  }
  return value
}

function shortJson(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str: string
  try {
    str = typeof value === 'string' ? value : JSON.stringify(redact(value))
  } catch {
    str = String(value)
  }
  if (str.length > MAX_LOG_LEN) {
    return str.slice(0, MAX_LOG_LEN) + `…(${str.length - MAX_LOG_LEN} more)`
  }
  return str
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(response: Response, method: string, path: string, startedAt: number): Promise<T> {
  const elapsed = Date.now() - startedAt
  if (response.status === 401) {
    console.warn(`[API] ✗ ${method} ${path} 401 ${elapsed}ms — phiên hết hạn, redirect /login`)
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    window.location.href = '/login'
    throw new Error('Phiên đăng nhập hết hạn')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const msg = data?.message || `Lỗi ${response.status}`
    console.error(`[API] ✗ ${method} ${path} ${response.status} ${elapsed}ms err="${msg}" body=${shortJson(data)}`)
    throw new Error(msg)
  }
  const data = (await response.json()) as T
  console.log(`[API] ← ${method} ${path} ${response.status} ${elapsed}ms body=${shortJson(data)}`)
  return data
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const startedAt = Date.now()
  const bodyPart = body !== undefined ? ` body=${shortJson(body)}` : ''
  console.log(`[API] → ${method} ${path}${bodyPart}`)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: getAuthHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return await handleResponse<T>(res, method, path, startedAt)
  } catch (err: any) {
    if (err?.name === 'TypeError') {
      const elapsed = Date.now() - startedAt
      console.error(`[API] ✗ ${method} ${path} NETWORK ${elapsed}ms err="${err.message}"`)
    }
    throw err
  }
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path)
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>('POST', path, body)
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PUT', path, body)
  },
  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path)
  },
}
