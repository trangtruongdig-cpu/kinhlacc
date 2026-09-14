import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface PatientUser {
  id: number
  phone: string
  fullName: string
}

function readStoredPatient(): PatientUser | null {
  try {
    const raw = localStorage.getItem('patient_user')
    return raw ? (JSON.parse(raw) as PatientUser) : null
  } catch {
    return null
  }
}

export const usePatientAuthStore = defineStore('patientAuth', () => {
  const token = ref<string | null>(localStorage.getItem('patient_token'))
  const patient = ref<PatientUser | null>(readStoredPatient())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setSession(accessToken: string, p: PatientUser) {
    token.value = accessToken
    patient.value = p
    localStorage.setItem('patient_token', accessToken)
    localStorage.setItem('patient_user', JSON.stringify(p))
  }

  async function login(phone: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/patient-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status === 401 || response.status === 400) {
          throw new Error(data?.message || 'Số điện thoại hoặc mật khẩu không đúng')
        }
        throw new Error(`Không kết nối được tới máy chủ (lỗi ${response.status}). Vui lòng thử lại sau ít phút.`)
      }

      const data = await response.json()
      setSession(data.access_token, data.patient)
      return true
    } catch (err: any) {
      const laLoiMang = err instanceof TypeError
      error.value = laLoiMang
        ? 'Không kết nối được tới máy chủ. Kiểm tra mạng hoặc thử lại sau ít phút.'
        : err.message || 'Đã có lỗi xảy ra'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(phone: string, password: string, fullName: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/patient-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, fullName }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }

      const data = await response.json()
      // API register trả về login(newPatient) nên format sẽ giống login
      setSession(data.access_token, data.patient)
      return true
    } catch (err: any) {
      const laLoiMang = err instanceof TypeError
      error.value = laLoiMang
        ? 'Không kết nối được tới máy chủ. Kiểm tra mạng hoặc thử lại sau ít phút.'
        : err.message || 'Đã có lỗi xảy ra'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Lấy lại thông tin (Nếu cần, có thể lấy từ /patients/:id) */
  async function fetchMe(): Promise<void> {
    if (!token.value || !patient.value?.id) return
    try {
      const res = await fetch(`${API_BASE}/patients/${patient.value.id}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (res.status === 401 || res.status === 403) {
        logout()
        return
      }
      if (!res.ok) return
      const p = await res.json()
      // Cập nhật lại fullName nếu có đổi
      patient.value = { id: p.id, phone: p.phone, fullName: p.fullName || p.phone }
      localStorage.setItem('patient_user', JSON.stringify(patient.value))
    } catch {
      // Lỗi mạng -> giữ nguyên thông tin đã lưu, không phá phiên.
    }
  }

  function logout() {
    token.value = null
    patient.value = null
    localStorage.removeItem('patient_token')
    localStorage.removeItem('patient_user')
  }

  function clearError() {
    error.value = null
  }

  return {
    token,
    patient,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    fetchMe,
    clearError,
    logout,
  }
})
