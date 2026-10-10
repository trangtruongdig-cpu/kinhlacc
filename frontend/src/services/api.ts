import { baoApiCham, baoLoiApi } from '@/lib/baoSuCo'
import { nenThuLai, treTruocKhiThu, HAN_GIO_DOC_MS, HAN_GIO_GHI_MS } from '@/lib/thuLaiApi'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/** Dựng URL hiển thị cho ảnh: http tuyệt đối giữ nguyên; "/uploads/..." (backend serve) ghép API_BASE. */
export function assetUrl(u?: string | null): string {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/uploads/')) return `${API_BASE}${u}`
  return u
}

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

// Log chi tiết mỗi request (kèm JSON.stringify thân bài) chỉ bật khi DEV.
// Prod: bỏ hẳn để đỡ CPU/GC trên máy yếu; lỗi/401 vẫn luôn log (xem console.warn/error bên dưới).
const DEBUG_API = import.meta.env.DEV

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
  const token = localStorage.getItem('access_token') || localStorage.getItem('patient_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(response: Response, method: string, path: string, startedAt: number): Promise<T> {
  const elapsed = Date.now() - startedAt
  if (response.status === 401) {
    const hasPatientToken = !!localStorage.getItem('patient_token')
    const hasAccessToken = !!localStorage.getItem('access_token')

    if (hasPatientToken && !hasAccessToken) {
      // Phiên KHÁCH HÀNG hết hạn → chỉ xoá token khách hàng
      console.warn(`[API] ✗ ${method} ${path} 401 ${elapsed}ms — phiên khách hàng hết hạn`)
      localStorage.removeItem('patient_token')
      localStorage.removeItem('patient_user')
      window.location.href = '/khach-hang/dang-nhap'
    } else {
      // Phiên NHÂN VIÊN hết hạn (hoặc token bị xoá)
      console.warn(`[API] ✗ ${method} ${path} 401 ${elapsed}ms — phiên hết hạn, redirect /login`)
      localStorage.removeItem('access_token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    throw new Error('Phiên đăng nhập hết hạn')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const msg = data?.message || `Lỗi ${response.status}`
    console.error(`[API] ✗ ${method} ${path} ${response.status} ${elapsed}ms err="${msg}" body=${shortJson(data)}`)
    // Gửi về tab "Góp Ý & Lỗi". Console chỉ sống trong máy người dùng và mất khi đóng tab —
    // lỗi chỉ tồn tại ở đó thì coi như chưa từng xảy ra đối với người sửa.
    baoLoiApi(method, path, response.status, msg, elapsed)
    throw new Error(msg)
  }
  const data = (await response.json()) as T
  if (DEBUG_API) console.log(`[API] ← ${method} ${path} ${response.status} ${elapsed}ms body=${shortJson(data)}`)
  baoApiCham(method, path, elapsed)
  return data
}

const nguMs = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** `fetch` ném TypeError cho MỌI kiểu đứt đường; AbortError là do chính ta cắt vì quá hạn. */
function laLoiMangHoacQuaHan(err: unknown): boolean {
  const e = err as { name?: string } | null
  return e?.name === 'TypeError' || e?.name === 'AbortError'
}

/**
 * `khoa` là `Idempotency-Key` — máy khách sinh MỘT lần cho mỗi Ý ĐỊNH ghi. Có nó thì máy chủ
 * nhận ra lần bấm lại và trả lại kết quả cũ, nên mới được phép tự thử lại thao tác GHI.
 * Luật thử lại nằm ở `@/lib/thuLaiApi` (có phép kiểm riêng).
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  khoa?: string,
): Promise<T> {
  const laGhi = method !== 'GET'
  const hanGio = laGhi ? HAN_GIO_GHI_MS : HAN_GIO_DOC_MS
  let lanDaThu = 0

  for (;;) {
    const startedAt = Date.now()
    if (DEBUG_API) {
      const bodyPart = body !== undefined ? ` body=${shortJson(body)}` : ''
      const lan = lanDaThu ? ` (thử lần ${lanDaThu + 1})` : ''
      console.log(`[API] → ${method} ${path}${bodyPart}${lan}`)
    }
    // Không có hạn giờ thì một request treo sẽ khoá nút bấm vô thời hạn, và màn hình đứng im
    // mà không ai biết vì sao.
    const canh = new AbortController()
    const dongHo = setTimeout(() => canh.abort(), hanGio)
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { ...getAuthHeaders(), ...(khoa ? { 'Idempotency-Key': khoa } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: canh.signal,
      })
      if (
        !res.ok &&
        nenThuLai({ laGhi, coKhoa: !!khoa, lanDaThu, status: res.status, laLoiMang: false })
      ) {
        await nguMs(treTruocKhiThu(lanDaThu))
        lanDaThu += 1
        continue
      }
      return await handleResponse<T>(res, method, path, startedAt)
    } catch (err: any) {
      const laMang = laLoiMangHoacQuaHan(err)
      if (
        laMang &&
        nenThuLai({ laGhi, coKhoa: !!khoa, lanDaThu, status: null, laLoiMang: true })
      ) {
        await nguMs(treTruocKhiThu(lanDaThu))
        lanDaThu += 1
        continue
      }
      if (laMang) {
        const elapsed = Date.now() - startedAt
        // Lỗi mạng của fetch KHÔNG nói được lý do (CORS, DNS, backend sập đều ra "Failed to
        // fetch"). Chính vì mù mịt thế nên nó càng đáng ghi lại kèm route và trình duyệt.
        const lyDo =
          err?.name === 'AbortError' ? `quá hạn ${hanGio}ms` : err?.message || 'Failed to fetch'
        console.error(`[API] ✗ ${method} ${path} NETWORK ${elapsed}ms err="${lyDo}"`)
        baoLoiApi(method, path, null, lyDo, elapsed)
      }
      throw err
    } finally {
      clearTimeout(dongHo)
    }
  }
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path)
  },
  post<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('POST', path, body, khoa)
  },
  put<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('PUT', path, body, khoa)
  },
  patch<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('PATCH', path, body, khoa)
  },
  delete<T>(path: string, khoa?: string): Promise<T> {
    return request<T>('DELETE', path, undefined, khoa)
  },
  /** Upload multipart (FormData). KHÔNG set Content-Type để trình duyệt tự thêm boundary. */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    const startedAt = Date.now()
    if (DEBUG_API) console.log(`[API] → POST(upload) ${path}`)
    const token = localStorage.getItem('access_token') || localStorage.getItem('patient_token')
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    return handleResponse<T>(res, 'POST', path, startedAt)
  },
}
