<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientAuthStore } from '@/stores/patientAuth'

const router = useRouter()
const authStore = usePatientAuthStore()
const records = ref<any[]>([])
const isLoading = ref(true)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function fetchRecords() {
  if (!authStore.token) return
  isLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/examinations/my-records`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        // Tìm ca khám mới nhất (đầu tiên trong danh sách giả định đã sort desc)
        const latestRecord = data[0]
        router.replace({ 
          name: 'patient-record-detail', 
          params: { patientId: authStore.patient?.id, examId: latestRecord.id } 
        })
        return // Không gán records.value nữa để tránh render chớp nhoáng
      }
      records.value = data
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phiếu khám', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRecords()
})

function formatDate(dateString: string) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(dateString: string) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="my-records">
    <h2 class="page-title">Hồ Sơ Khám Bệnh</h2>

    <div v-if="isLoading" class="loading">
      Đang tải danh sách...
    </div>
    
    <div v-else-if="records.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Bạn chưa có hồ sơ khám bệnh nào.</p>
    </div>

    <div v-else class="record-list">
      <div v-for="record in records" :key="record.id" class="record-card">
        <div class="record-header">
          <div class="record-date">
            <span class="date">{{ formatDate(record.thoiDiemKham || record.createdAt) }}</span>
            <span class="time">{{ formatTime(record.thoiDiemKham || record.createdAt) }}</span>
          </div>
          <span class="record-status">Đã khám</span>
        </div>
        
        <div class="record-body">
          <div v-if="record.chanDoan?.lyDoKham" class="record-row">
            <span class="label">Lý do khám:</span>
            <span class="value">{{ record.chanDoan.lyDoKham }}</span>
          </div>
          <div class="record-row">
            <span class="label">Chẩn đoán chính:</span>
            <span class="value">{{ record.chanDoan?.benhChinh || 'Đang cập nhật' }}</span>
          </div>
        </div>

        <div class="record-actions">
          <RouterLink :to="{ name: 'patient-record-detail', params: { patientId: authStore.patient?.id, examId: record.id } }" class="btn-view">
            Xem chi tiết phiếu khám
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-records {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--gray-900);
}
.loading, .empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--gray-500);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}
.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.record-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 1px solid var(--gray-200);
}
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--brown-50);
  border-bottom: 1px solid var(--brown-100);
}
.record-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.date {
  font-weight: 600;
  color: var(--brown-700);
}
.time {
  font-size: var(--font-size-sm);
  color: var(--brown-500);
}
.record-status {
  font-size: var(--font-size-xs);
  background: var(--success-bg);
  color: var(--success);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}
.record-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.record-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.label {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}
.value {
  font-weight: 500;
  color: var(--gray-900);
}
.record-actions {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--gray-100);
  display: flex;
  justify-content: flex-end;
}
.btn-view {
  display: inline-block;
  padding: 8px 16px;
  background: var(--white);
  color: var(--brown-600);
  border: 1px solid var(--brown-600);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
}
.btn-view:hover {
  background: var(--brown-50);
}
@media (min-width: 640px) {
  .record-row {
    flex-direction: row;
    align-items: baseline;
    gap: var(--space-2);
  }
  .label {
    min-width: 120px;
  }
}
</style>
