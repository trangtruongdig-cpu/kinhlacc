<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mountAcuMap, unmountAcuMap } from '@/lib/acuMap3d'

const route = useRoute()
const router = useRouter()
const mountPoint = ref<HTMLElement | null>(null)
const loading = ref(true)
const progress = ref(0) // % tải model cho màn chờ to (0 = chưa có số → chỉ hiện spinner)
const error = ref<string | null>(null)

// Kênh tiến trình từ engine map3d.js (đặt trên window) → màn chờ to của Vue.
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
// Mobile: nút gạt ẩn mô hình 3D để danh sách kinh/huyệt chiếm trọn chiều cao.
// Ẩn bằng display:none là an toàn — onResize của engine có guard `if(!w||!h)return`,
// và ResizeObserver trên #mapStage tự chỉnh lại canvas khi hiện mô hình trở lại.
const showModel = ref(true)

// Mobile: phóng to mô hình 3D ra TOÀN màn hình để xem cho rõ (khung mặc định khá nhỏ).
// Khi bật: .km3d-mount phủ kín màn hình (position:fixed), ẩn ngăn danh sách → mô hình chiếm trọn.
const expanded = ref(false)

/**
 * Sau khi đổi kích thước khung (vào/ra toàn màn hình), canh lại camera cho mô hình vừa khít.
 * Engine có sẵn ResizeObserver trên #mapStage (tự đổi tỉ lệ canvas); ta bấm hộ nút "Đặt Lại Góc
 * Nhìn" để khung hình vừa vặn màn hình mới. Đợi 2 frame cho layout + observer chạy xong rồi mới canh.
 */
function refitModel() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.getElementById('mapReset')?.click()
    }),
  )
}

function toggleExpand() {
  expanded.value = !expanded.value
  // Khoá cuộn trang nền khi xem toàn màn hình để không bị "trôi" phía sau.
  document.body.style.overflow = expanded.value ? 'hidden' : ''
  refitModel()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && expanded.value) toggleExpand()
}

/**
 * Cầu nối engine → SPA: drawer 3D có sẵn 2 link "Xem thêm" (href #acu/<id>) và "Lý thuyết kinh
 * đầy đủ" (href #meridian/<mã>) — di sản từ webapp gốc, không tự điều hướng trong SPA. Bắt sự kiện
 * hashchange để đẩy sang trang "Từ Điển" đúng mục huyệt / đúng đường kinh.
 */
function onHashNav() {
  const h = location.hash
  let m: RegExpExecArray | null
  if ((m = /^#acu\/(\d+)/.exec(h))) {
    router.push({ name: 'tu-dien', query: { acu: m[1] } })
  } else if ((m = /^#meridian\/([A-Za-z]+)/.exec(h))) {
    router.push({ name: 'tu-dien', query: { mer: m[1] } })
  }
}

onMounted(async () => {
  const w = window as unknown as AcuWin
  if (w.ACU_MODEL_READY) {
    // Model đã tải sẵn từ lần trước (engine singleton) → khỏi hiện màn chờ.
    loading.value = false
  } else {
    // Engine báo % khi tải model + báo "xong" → màn chờ to hiện % rồi tự ẩn.
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
    window.addEventListener('keydown', onKeydown)
    // Mở từ "Từ Điển" với ?focus=<mã huyệt> → bay tới huyệt đó (engine đã sẵn sàng sau mountAcuMap).
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
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = '' // phòng khi rời trang lúc đang phóng to
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
  <div class="km3d-page">
    <div v-if="error" class="km3d-error">
      <p><strong>Không tải được đồ hình 3D.</strong></p>
      <p>{{ error }}</p>
    </div>

    <!-- Nút gạt ẩn/hiện mô hình 3D — chỉ hiện trên mobile (CSS), để dành chỗ cho danh sách. -->
    <button
      type="button"
      class="km3d-toggle"
      :aria-pressed="!showModel"
      @click="showModel = !showModel"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
      <span>{{ showModel ? 'Ẩn mô hình 3D — mở rộng danh sách' : 'Hiện mô hình 3D' }}</span>
    </button>

    <div class="km3d-mount" :class="{ 'hide-model': !showModel, 'is-expanded': expanded }" ref="mountPoint">
      <!-- Nút phóng to mô hình ra TOÀN màn hình (mobile) — bấm lại hoặc Esc để thu nhỏ. -->
      <button
        type="button"
        class="km3d-expand"
        :aria-pressed="expanded"
        :title="expanded ? 'Thu nhỏ mô hình' : 'Phóng to mô hình toàn màn hình'"
        @click="toggleExpand"
      >
        <svg v-if="!expanded" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        </svg>
        <span>{{ expanded ? 'Thu Nhỏ' : 'Phóng To' }}</span>
      </button>

      <div v-if="loading" class="km3d-loading">
        <div class="km3d-spinner" aria-hidden="true"></div>
        <p>Đang tải đồ hình kinh lạc 3D…<span v-if="progress > 0"> {{ progress }}%</span></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.km3d-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.km3d-error {
  flex: none;
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  font-size: var(--font-size-sm);
}
.km3d-error p { margin: 0 0 var(--space-1); }

/* Khung chứa đồ hình — engine 3D (.acu3d) gắn vào đây. Đặt chiều cao CỐ ĐỊNH (calc) để
 * .acu3d{height:100%} luôn resolve chắc chắn (tránh bẫy percentage-height của flexbox).
 * 140px ≈ header 64 + padding trên/dưới của content-area. */
.km3d-mount {
  flex: none;
  height: calc(100vh - 140px);
  min-height: 440px;
  position: relative;
}

.km3d-loading {
  position: absolute;
  inset: 0;
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
.km3d-spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: km3d-spin 0.7s linear infinite;
}
@keyframes km3d-spin { to { transform: rotate(360deg); } }

/* Nút "Phóng To" — nổi ở góc dưới-phải khung 3D, chỉ hiện trên mobile (≤860px). */
.km3d-expand {
  display: none;
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 6;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 14px;
  background: var(--brown-700);
  color: #fff;
  border: 0;
  border-radius: 999px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  cursor: pointer;
}
.km3d-expand svg { flex: none; }
/* Khi đang ẩn mô hình (mở rộng danh sách) thì không có gì để phóng to → ẩn nút. */
.km3d-mount.hide-model .km3d-expand { display: none !important; }

/* Chế độ TOÀN MÀN HÌNH: khung 3D phủ kín màn hình, ẩn ngăn danh sách → mô hình to hết cỡ. */
.km3d-mount.is-expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100vh;
  height: 100dvh; /* trừ thanh địa chỉ trình duyệt mobile để không bị tràn */
  min-height: 0;
  margin: 0;
  border-radius: 0;
  background: var(--surface);
}
.km3d-mount.is-expanded :deep(.acu3d) { border: 0; border-radius: 0; }
.km3d-mount.is-expanded :deep(.map-drawer) { display: none; }
/* Giữ nút ở góc dưới-phải (tránh đè thanh công cụ/ô tìm kiếm ở trên); luôn hiện để có lối thoát. */
.km3d-mount.is-expanded .km3d-expand {
  display: inline-flex !important;
}

/* Nút gạt ẩn/hiện mô hình 3D — mặc định ẨN, chỉ hiện trên mobile (≤860px). */
.km3d-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 9px var(--space-4);
  background: var(--surface);
  color: var(--brown-700);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.km3d-toggle:hover { background: var(--brown-50); border-color: var(--brown-300); }
.km3d-toggle svg { flex: none; }

@media (max-width: 860px) {
  .km3d-toggle { display: flex; }
  .km3d-expand { display: inline-flex; }
  /* Khi ẩn mô hình: giấu sân khấu 3D, cho ngăn chọn (kinh + huyệt) chiếm trọn chiều cao. */
  .km3d-mount.hide-model :deep(.map-stage) { display: none; }
  .km3d-mount.hide-model :deep(.map-drawer) { max-height: none; flex: 1 1 auto; }
}
@media (max-width: 768px) {
  /* Trừ thêm chiều cao của nút gạt phía trên (≈54px) để khung không tràn quá viewport. */
  .km3d-mount { height: calc(100vh - 162px); }
}
@media (max-width: 480px) {
  /* Điện thoại nhỏ: hạ chiều cao tối thiểu để đồ hình không lấn quá nhiều. */
  .km3d-mount { min-height: 360px; }
}
@media (max-height: 480px) {
  /* Điện thoại xoay NGANG (màn thấp): không ép khung cao hơn viewport. */
  .km3d-mount { height: calc(100vh - 144px); min-height: 240px; }
}
</style>
