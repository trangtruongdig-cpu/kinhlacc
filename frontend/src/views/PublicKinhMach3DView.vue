<script setup lang="ts">
/**
 * PublicKinhMach3DView — Trang "Đồ Hình Kinh Lạc 3D" CÔNG KHAI (khách chưa đăng nhập).
 *
 * Dùng ĐÚNG engine 3D thật (mountAcuMap) như trang trong app: có danh sách đường kinh, huyệt,
 * ô tìm kiếm và bay tới huyệt. Khác biệt:
 *   • Ẩn nút "Chấm Tay" (chế độ sửa vị trí huyệt) → đúng tinh thần chỉ-xem cho khách.
 *   • Link "Xem thêm / Lý thuyết kinh" trong drawer → mời ĐĂNG NHẬP (tra cứu cần tài khoản).
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mountAcuMap, unmountAcuMap } from '@/lib/acuMap3d'
import PublicTopBar from '@/components/PublicTopBar.vue'

const route = useRoute()
const router = useRouter()
const mountPoint = ref<HTMLElement | null>(null)
const loading = ref(true)
const progress = ref(0) // % tải model cho màn chờ (0 = chưa có số → chỉ hiện spinner)
const error = ref<string | null>(null)

/**
 * Kênh tiến trình từ engine map3d.js (đặt trên window) → màn chờ của Vue. Giữ màn chờ kèm % cho tới
 * khi mô hình 3D thật sự tải xong (ACU_ON_MODEL_READY), thay vì tắt ngay khi mountAcuMap trả về —
 * lúc đó body-layers.glb còn đang tải, khách nhìn vùng trống sẽ thấy "chờ lâu".
 */
interface AcuWin {
  ACU_MODEL_READY?: boolean
  ACU_ON_MODEL_PROGRESS?: (pct: number) => void
  ACU_ON_MODEL_READY?: () => void
  AcuMap?: { focus: (c: string) => void }
}
let safetyTimer: ReturnType<typeof setTimeout> | null = null
function finishLoading() {
  progress.value = 100
  loading.value = false
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
}

/**
 * Drawer 3D có sẵn link "Xem thêm" (#acu/<id>) và "Lý thuyết kinh" (#meridian/<mã>) — di sản từ
 * webapp gốc. Với khách công khai, tra cứu chi tiết cần đăng nhập → đẩy sang trang đăng nhập.
 */
function onHashNav() {
  const h = location.hash
  if (/^#acu\/\d+/.test(h) || /^#meridian\/[A-Za-z]+/.test(h)) {
    // Xoá hash để không kẹt lại khi quay về, rồi mời đăng nhập.
    history.replaceState(null, '', location.pathname + location.search)
    router.push({ name: 'login' })
  }
}

onMounted(async () => {
  const w = window as unknown as AcuWin
  if (w.ACU_MODEL_READY) {
    // Model đã tải sẵn từ lần trước (engine singleton) → khỏi hiện màn chờ.
    loading.value = false
  } else {
    // Engine báo % khi tải model + báo "xong" → màn chờ hiện % rồi tự ẩn.
    w.ACU_ON_MODEL_PROGRESS = (pct: number) => {
      progress.value = Math.max(progress.value, Math.min(99, pct))
    }
    w.ACU_ON_MODEL_READY = finishLoading
    // Phòng hờ: nếu engine không báo "xong" (vd khung 0px nên model chưa tải), 30s sau vẫn ẩn màn chờ.
    safetyTimer = setTimeout(() => {
      loading.value = false
    }, 30000)
  }
  try {
    if (mountPoint.value) await mountAcuMap(mountPoint.value)
    window.addEventListener('hashchange', onHashNav)
    // Mở từ Từ Điển công khai với ?focus=<mã huyệt> → bay tới huyệt đó (engine đã sẵn sàng).
    const focus = route.query.focus
    const code = Array.isArray(focus) ? focus[0] : focus
    if (code) w.AcuMap?.focus(code)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    finishLoading()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashNav)
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
  // Gỡ callback để engine không gọi vào component đã huỷ ở lần điều hướng sau.
  const w = window as unknown as AcuWin
  w.ACU_ON_MODEL_PROGRESS = undefined
  w.ACU_ON_MODEL_READY = undefined
  unmountAcuMap()
})
</script>

<template>
  <div class="pub3d">
    <PublicTopBar title="Đồ Hình Kinh Lạc 3D" />

    <div class="pub3d-hint">
      <span class="pub3d-hint-text">
        Kéo để xoay · Bấm huyệt để xem · Gõ ô tìm kiếm để bay tới huyệt. Đây là bản
        <strong>xem thử</strong> — đăng nhập để tra cứu chi tiết và dùng đầy đủ.
      </span>
    </div>

    <div v-if="error" class="pub3d-error">
      <p><strong>Không tải được đồ hình 3D.</strong></p>
      <p>{{ error }}</p>
    </div>

    <div class="pub3d-mount" ref="mountPoint">
      <div v-if="loading" class="pub3d-loading">
        <div class="pub3d-spinner" aria-hidden="true"></div>
        <p>Đang tải đồ hình kinh lạc 3D…<span v-if="progress > 0"> {{ progress }}%</span></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pub3d {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-app);
}

.pub3d-hint {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-3) var(--space-5) 0;
}
.pub3d-hint-text {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 1.6;
}
.pub3d-hint-text strong {
  color: var(--brown-700);
}

.pub3d-error {
  max-width: 1280px;
  margin: var(--space-3) auto 0;
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
}
.pub3d-error p {
  margin: 0 0 var(--space-1);
}

/* Khung chứa engine 3D — chiều cao cố định để .acu3d{height:100%} luôn resolve. */
.pub3d-mount {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  max-width: 1280px;
  margin: var(--space-3) auto 0;
  padding: 0 var(--space-5) var(--space-5);
  height: calc(100vh - 120px);
  min-height: 440px;
}

/* Ẩn nút "Chấm Tay" (sửa vị trí huyệt) — khách chỉ-xem, không chỉnh dữ liệu. */
.pub3d-mount :deep(#mapEdit) {
  display: none !important;
}

/* Ẩn nút "Bàn Tay/Chân" (phóng to bàn tay/chân) ở bản xem thử. */
.pub3d-mount :deep(#mapInsetBtn) {
  display: none !important;
}

.pub3d-loading {
  position: absolute;
  inset: 0 var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--brown-600);
  background: var(--surface);
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  z-index: 5;
}
.pub3d-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: pub3d-spin 0.7s linear infinite;
}
@keyframes pub3d-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .pub3d-mount {
    height: calc(100vh - 150px);
    padding: 0 var(--space-3) var(--space-3);
  }
  .pub3d-hint {
    padding: var(--space-3) var(--space-3) 0;
  }
}
</style>
