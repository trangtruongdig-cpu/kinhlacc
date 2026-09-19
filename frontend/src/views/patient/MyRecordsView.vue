<script setup lang="ts">
/**
 * MyRecordsView — Hồ Sơ Chẩn Trị của chính người bệnh.
 *
 * Trình bày = DẢI MỐC ĐO theo thời gian (cùng lối với dải truyền biến ở trang Kết Quả Đo): mỗi mốc
 * là một ô BẤM ĐƯỢC mở thẳng lần đo đó, mang ngày · kinh (Lục Kinh) · một dòng thể chất ngắn
 * (Khí · Huyết · Hư-Thực · Biểu-Lý). Giữa hai mốc là số ngày + hướng chuyển biến.
 *
 * Cố ý KHÔNG bày chi tiết ở đây: người bệnh cần liếc là thấy đang chuyển tốt hay xấu, muốn sâu hơn
 * thì bấm vào mốc. Các con số tính tại máy người đọc bằng lib/tomTatCaDo.ts — cùng bộ hàm trang
 * Kết Quả Đo dùng, nên không lệch trang chi tiết.
 */
import { ref, computed, onMounted } from 'vue'
import { usePatientAuthStore } from '@/stores/patientAuth'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
import DaiMocCaDo from '@/components/DaiMocCaDo.vue'
import { type CaDoInput } from '@/lib/tomTatCaDo'
import type { TheKinhMap } from '@/lib/lucKinh'

const authStore = usePatientAuthStore()
const records = ref<CaDoInput[]>([])
const theKinhMap = ref<TheKinhMap | null>(null)
const isLoading = ref(true)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/** Gọi API bằng ĐÚNG token người bệnh (không dùng wrapper api.ts — wrapper ưu tiên token nhân viên
 * nếu máy đó có cả hai phiên, sẽ tra nhầm hồ sơ). */
async function layJson<T>(path: string): Promise<T | null> {
  if (!authStore.token) return null
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function fetchRecords() {
  isLoading.value = true
  try {
    const data = await layJson<CaDoInput[]>('/examinations/my-records')
    if (Array.isArray(data)) records.value = data
  } finally {
    isLoading.value = false
  }
}

/** Bản đồ thể bệnh → Lục Kinh do engine suy. Hỏng/không có → lib rơi về bảng tĩnh, vẫn ra kết luận. */
async function fetchTheKinhMap() {
  const m = await layJson<TheKinhMap>('/thuong-han/the-kinh')
  if (m && Object.keys(m).length) theKinhMap.value = m
}

onMounted(() => {
  fetchRecords()
  fetchTheKinhMap()
})

// ── Dựng dải mốc ──────────────────────────────────────────────────────────────────────────────
</script>

<template>
  <div class="my-records">
    <header class="page-head">
      <h2 class="page-title">Hồ Sơ Chẩn Trị</h2>
      <p class="page-sub">Bấm vào một lần đo để xem chi tiết kết quả đo nhiệt độ Kinh Lạc.</p>
    </header>

    <div v-if="isLoading" class="loading">Đang tải danh sách...</div>

    <div v-else-if="!records.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Bạn chưa có hồ sơ chẩn trị nào.</p>
    </div>

    <template v-else>
      <DaiMocCaDo
        :records="records"
        :the-kinh-map="theKinhMap"
        route-name="patient-record-detail"
        :fallback-patient-id="authStore.patient?.id ?? null"
      />

      <MedicalDisclaimer compact />
    </template>
  </div>
</template>

<style scoped>
.my-records {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}
.page-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--gray-900);
}
.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.loading,
.empty-state {
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

</style>
