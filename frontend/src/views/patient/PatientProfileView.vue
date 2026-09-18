<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePatientAuthStore } from '@/stores/patientAuth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const authStore = usePatientAuthStore()
const isLoading = ref(false)
const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const formData = ref({
  fullName: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  province: ''
})

function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return ''
  // YYYY-MM-DD to DD/MM/YYYY
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function formatDateForApi(dateStr: string): string | null {
  if (!dateStr) return null
  const str = dateStr.trim()
  // YYYY format
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`
  }
  // DD/MM/YYYY or DD-MM-YYYY format
  const parts = str.includes('/') ? str.split('/') : str.split('-')
  if (parts.length === 3) {
    // If user enters DD/MM/YYYY
    const [p0 = '', p1 = '', p2 = ''] = parts
    if (p0.length <= 2) {
      const d = p0.padStart(2, '0')
      const m = p1.padStart(2, '0')
      const y = p2
      return `${y}-${m}-${d}`
    }
    // If it's already YYYY-MM-DD
    if (p0.length === 4) {
      return str
    }
  }
  return str
}


onMounted(async () => {
  if (!authStore.patient?.id || !authStore.token) return
  isLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/patients/${authStore.patient.id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json()
      formData.value = {
        fullName: data.fullName || '',
        phone: data.phone || '',
        gender: data.gender || '',
        dateOfBirth: formatDateForDisplay(data.dateOfBirth),
        address: data.address || '',
        province: data.province || ''
      }
    }
  } catch (err) {
    console.error('Failed to fetch patient data', err)
  } finally {
    isLoading.value = false
  }
})

async function saveProfile() {
  if (!authStore.patient?.id || !authStore.token) return
  isSaving.value = true
  successMessage.value = ''
  errorMessage.value = ''
  
  try {
    const res = await fetch(`${API_BASE}/patients/${authStore.patient.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}` 
      },
      body: JSON.stringify({
        fullName: formData.value.fullName,
        gender: formData.value.gender,
        dateOfBirth: formatDateForApi(formData.value.dateOfBirth),
        address: formData.value.address,
        province: formData.value.province
      })
    })

    if (res.ok) {
      successMessage.value = 'Cập nhật thông tin thành công!'
      authStore.fetchMe() // Update the name in store/layout if it changed
    } else {
      errorMessage.value = 'Có lỗi xảy ra khi lưu thông tin.'
    }
  } catch (err) {
    errorMessage.value = 'Lỗi kết nối. Vui lòng thử lại.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="patient-profile">
    <div class="page-header">
      <h1 class="page-title">Hồ Sơ Cá Nhân</h1>
      <p class="page-desc">Cập nhật thông tin của bạn để thuận tiện cho việc liên hệ và gửi nhận hàng.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      Đang tải thông tin...
    </div>
    <div v-else class="profile-card">
      <form @submit.prevent="saveProfile" class="profile-form">
        <div class="form-group">
          <label>Họ và tên</label>
          <input type="text" v-model="formData.fullName" required class="form-input" placeholder="Nhập họ và tên" />
        </div>
        
        <div class="form-group">
          <label>Số điện thoại</label>
          <input type="text" v-model="formData.phone" readonly class="form-input readonly-input" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Giới tính</label>
            <select v-model="formData.gender" class="form-input">
              <option value="">-- Chọn giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div class="form-group">
            <label>Năm sinh / Ngày sinh</label>
            <input type="text" v-model="formData.dateOfBirth" class="form-input" placeholder="VD: 1990 hoặc 01/01/1990" />
          </div>
        </div>

        <div class="form-group">
          <label>Địa chỉ nhận hàng / Nơi ở</label>
          <textarea v-model="formData.address" rows="3" class="form-input" placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện)"></textarea>
        </div>

        <div class="form-group">
          <label>Tỉnh / Thành phố</label>
          <input type="text" v-model="formData.province" class="form-input" placeholder="Nhập tỉnh / thành phố" />
        </div>

        <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
        <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.patient-profile {
  padding: 1rem 0;
  max-width: 600px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brown-800);
  margin-bottom: 0.25rem;
}
.page-desc {
  font-size: 0.9rem;
  color: var(--gray-600);
}
.profile-card {
  background: var(--white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-row {
  display: flex;
  gap: 1rem;
}
.form-row .form-group {
  flex: 1;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form-group label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-800);
}
.form-input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--gray-800);
  background: var(--white);
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-input:focus {
  outline: none;
  border-color: var(--brown-500);
}
.readonly-input {
  background: var(--gray-100);
  color: var(--gray-600);
  cursor: not-allowed;
}
.alert {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}
.alert.success {
  background: #e6f4ea;
  color: #137333;
}
.alert.error {
  background: #fce8e6;
  color: #c5221f;
}
.form-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}
.btn-save {
  background: var(--brown-600);
  color: var(--white);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-save:hover:not(:disabled) {
  background: var(--brown-700);
}
.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.loading-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--gray-500);
  font-size: 0.95rem;
}
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 1.25rem;
  }
}
</style>
