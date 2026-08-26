import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ALWAYS_ALLOWED } from '@/constants/pages'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface VaiTroLite {
  id?: string
  ma: string
  ten: string
  laQuanTri: boolean
  trangCho: string[]
}

export interface AppUser {
  id: string
  username: string
  hoTen: string | null
  email: string | null
  vaiTro: VaiTroLite | null
}

function readStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AppUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const user = ref<AppUser | null>(readStoredUser())
  const username = ref<string | null>(localStorage.getItem('username'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const vaiTro = computed(() => user.value?.vaiTro || null)
  const tenVaiTro = computed(() => user.value?.vaiTro?.ten || 'Người Dùng')
  const isQuanTri = computed(() => !!user.value?.vaiTro?.laQuanTri)
  const isLeTan = computed(() => user.value?.vaiTro?.ma === 'le_tan')

  /** Kiểm tra tài khoản hiện tại có được vào trang `pageKey` không. */
  function can(pageKey: string): boolean {
    if (ALWAYS_ALLOWED.has(pageKey)) return true
    const vt = user.value?.vaiTro
    if (!vt) return false
    if (vt.laQuanTri) return true
    return (vt.trangCho || []).includes(pageKey)
  }

  function setSession(accessToken: string, u: AppUser) {
    token.value = accessToken
    user.value = u
    username.value = u.username
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('username', u.username)
  }

  async function login(usernameInput: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        // 401 = backend đã xét và từ chối (sai tên đăng nhập/mật khẩu, hoặc tài khoản bị khoá) —
        // hiện đúng lý do đó. Mọi mã khác (502/503/504, lỗi mạng, HTML lỗi từ nginx khi backend sập)
        // KHÔNG phải do gõ sai — trước đây bị gộp chung nên máy chủ sập lại hiện "sai mật khẩu",
        // khiến người dùng tưởng nhầm mình gõ sai.
        if (response.status === 401) {
          throw new Error(data?.message === 'Invalid credentials' || !data?.message
            ? 'Tên đăng nhập hoặc mật khẩu không đúng'
            : data.message)
        }
        throw new Error(`Không kết nối được tới máy chủ (lỗi ${response.status}). Vui lòng thử lại sau ít phút.`)
      }

      const data = await response.json()
      setSession(data.access_token, data.user)
      return true
    } catch (err: any) {
      // TypeError của fetch() khi mất mạng/không tới được server (khác hẳn 401 ở trên).
      const laLoiMang = err instanceof TypeError
      error.value = laLoiMang
        ? 'Không kết nối được tới máy chủ. Kiểm tra mạng hoặc thử lại sau ít phút.'
        : err.message || 'Đã có lỗi xảy ra'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Lấy lại thông tin + quyền mới nhất từ server (gọi khi mở app / refresh). */
  async function fetchMe(): Promise<void> {
    if (!token.value) return
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (res.status === 401) {
        logout()
        return
      }
      if (!res.ok) return
      const u = (await res.json()) as AppUser
      user.value = u
      username.value = u.username
      localStorage.setItem('user', JSON.stringify(u))
      localStorage.setItem('username', u.username)
    } catch {
      // Lỗi mạng -> giữ nguyên thông tin đã lưu, không phá phiên.
    }
  }

  function logout() {
    token.value = null
    user.value = null
    username.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
  }

  function clearError() {
    error.value = null
  }

  return {
    token,
    user,
    username,
    vaiTro,
    tenVaiTro,
    isQuanTri,
    isLeTan,
    isLoading,
    error,
    isAuthenticated,
    can,
    login,
    fetchMe,
    clearError,
    logout,
  }
})
