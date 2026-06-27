import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export interface Patient {
  id: number
  fullName: string | null
  gender: string | null
  dateOfBirth: string | null
  timeOfBirth: string | null
  address: string | null
  province: string | null
  phone: string | null
  medicalHistory: string | null
  notes: string | null
  treatmentTarget?: number | null
  treatmentCourseStart?: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse {
  data: Patient[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreatePatientDto {
  fullName: string
  gender: string
  dateOfBirth?: string
  timeOfBirth?: string
  address?: string
  province?: string
  phone?: string
  medicalHistory?: string
  notes?: string
  treatmentTarget?: number | null
  treatmentCourseStart?: string | null
}

export type UpdatePatientDto = Partial<CreatePatientDto>

export const usePatientStore = defineStore('patient', () => {
  const patients = ref<Patient[]>([])
  const currentPatient = ref<Patient | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const totalPages = ref(1)
  const search = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPatients() {
    isLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      params.set('page', String(page.value))
      params.set('limit', String(limit.value))
      if (search.value.trim()) {
        params.set('search', search.value.trim())
      }

      const res = await api.get<PaginatedResponse>(`/patients?${params.toString()}`)
      patients.value = res.data
      total.value = res.total
      totalPages.value = res.totalPages
    } catch (err: any) {
      error.value = err.message || 'Không thể tải danh sách bệnh nhân'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPatient(id: number) {
    isLoading.value = true
    error.value = null
    try {
      currentPatient.value = await api.get<Patient>(`/patients/${id}`)
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  async function createPatient(dto: CreatePatientDto) {
    isLoading.value = true
    error.value = null
    try {
      await api.post('/patients', dto)
      await fetchPatients()
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function updatePatient(id: number, dto: UpdatePatientDto) {
    isLoading.value = true
    error.value = null
    try {
      await api.put(`/patients/${id}`, dto)
      await fetchPatients()
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deletePatient(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await api.delete(`/patients/${id}`)
      await fetchPatients()
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Nạp lại danh sách "từ đầu": về trang 1, xoá ô tìm kiếm, dọn dữ liệu cũ để hiện trạng thái đang tải
  // (không bị nháy danh sách cũ), rồi gọi API. Dùng khi vào / quay lại trang Bệnh Nhân — vì store là
  // singleton sống xuyên suốt điều hướng nên page/search/patients cũ vẫn còn, trông như bị "cache".
  async function reload() {
    page.value = 1
    search.value = ''
    patients.value = []
    total.value = 0
    totalPages.value = 1
    await fetchPatients()
  }

  function setPage(p: number) {
    page.value = p
    fetchPatients()
  }

  function setSearch(s: string) {
    search.value = s
    page.value = 1
    fetchPatients()
  }

  function clearError() {
    error.value = null
  }

  return {
    patients,
    currentPatient,
    total,
    page,
    limit,
    totalPages,
    search,
    isLoading,
    error,
    fetchPatients,
    fetchPatient,
    createPatient,
    updatePatient,
    deletePatient,
    reload,
    setPage,
    setSearch,
    clearError,
  }
})
