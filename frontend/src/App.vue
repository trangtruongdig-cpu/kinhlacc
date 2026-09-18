<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo, type SeoData } from '@/composables/useSeo'
import { routeSeo, defaultSeo } from '@/seo/routeSeo'
import ZaloButton from '@/components/ZaloButton.vue'
import { useAuthStore } from '@/stores/auth'
import { usePatientAuthStore } from '@/stores/patientAuth'

const route = useRoute()
const authStore = useAuthStore()
const patientAuthStore = usePatientAuthStore()

// Token dùng cho SSE: ưu tiên phiên nhân viên, không có thì dùng phiên bệnh nhân.
const sseToken = computed(() => authStore.token || patientAuthStore.token)

// ----- SSE Notification (Realtime Bookings) -----
//
// Yêu cầu cốt lõi: đường dây này phải TỰ LÀNH. Bản trước chỉ gán `onmessage`, không có onerror,
// không canh chết, không đồng bộ lại — nên trên điện thoại (khoá màn hình, chuyển app, đổi sóng)
// kết nối đứt là nằm im vĩnh viễn, và người dùng phải tải lại trang mới thấy dữ liệu mới.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const toastMessages = ref<{ id: number; type: string; msg: string; link?: string }[]>([])
let toastIdCounter = 0
let eventSource: EventSource | null = null

/** Không nhận được gì (kể cả nhịp tim 20s của server) quá ngần này → coi như đường dây đã chết. */
const WATCHDOG_MS = 55_000
let lastBeatAt = 0
let watchdogTimer: ReturnType<typeof setInterval> | null = null

/** Số thứ tự sự kiện gần nhất đã nhận — nhảy cóc nghĩa là đã bỏ lỡ sự kiện lúc mất mạng. */
let lastSeq = 0
/** Lần thử nối lại thứ mấy (dùng cho backoff khi server đang lỗi/token hỏng). */
let retryCount = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type = 'success', link?: string) {
  const id = toastIdCounter++
  toastMessages.value.push({ id, type, msg, link })
  setTimeout(() => {
    toastMessages.value = toastMessages.value.filter(t => t.id !== id)
  }, 10000)
}

function dismissToast(id: number) {
  toastMessages.value = toastMessages.value.filter(t => t.id !== id)
}

/**
 * Yêu cầu các màn hình đang mở tự nạp lại toàn bộ dữ liệu.
 *
 * `detail: null` là quy ước sẵn có: màn hình nào nhận null thì gọi lại API thay vì vá tại chỗ.
 * Dùng sau mỗi lần nối lại, vì mọi sự kiện xảy ra trong lúc đứt mạch đã mất hẳn.
 */
function requestFullResync() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('REFRESH_BOOKINGS', { detail: null }))
}

function playDing() {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    // Tiếng ting trong trẻo
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(1046.5, audioCtx.currentTime) // C6

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.6)
  } catch (e) {
    console.warn('Không thể phát âm thanh:', e)
  }
}

function closeStream() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

/** Hẹn nối lại với backoff 3s → 6s → 12s → 24s → tối đa 30s (tránh nện server khi nó đang lỗi). */
function scheduleReconnect(token: string | null) {
  if (!token || retryTimer) return
  const delay = Math.min(3000 * 2 ** retryCount, 30_000)
  retryCount += 1
  retryTimer = setTimeout(() => {
    retryTimer = null
    connectSSE(token)
  }, delay)
}

function connectSSE(token: string | null) {
  closeStream()

  // Luồng SSE nằm sau JwtAuthGuard — không có token thì server trả 401 và EventSource đóng
  // luôn (theo chuẩn, lỗi HTTP không được nối lại). Nên khách vãng lai thì khỏi mở.
  if (!token) return

  const es = new EventSource(`${API_BASE}/notifications/sse?token=${encodeURIComponent(token)}`)
  eventSource = es
  lastBeatAt = Date.now()

  es.onopen = () => {
    lastBeatAt = Date.now()
    // Nối lại xong là dữ liệu trên màn hình đã có thể cũ (mọi sự kiện lúc đứt mạch đã mất).
    // Lần mở ĐẦU TIÊN thì các màn hình tự nạp trong onMounted rồi, nên chỉ đồng bộ khi nối LẠI.
    if (retryCount > 0) requestFullResync()
    retryCount = 0
  }

  // Nhịp tim mang tên sự kiện riêng nên KHÔNG vào onmessage — bắt riêng để nuôi đồng hồ canh chết.
  es.addEventListener('ping', () => {
    lastBeatAt = Date.now()
  })

  es.onerror = () => {
    // Kết nối này đã bị thay bằng cái mới → bỏ qua, đừng để nó hẹn nối lại chồng lên.
    if (eventSource !== es) return
    // CLOSED = lỗi ở tầng HTTP (401 token hết hạn, 502 backend chết). Trình duyệt sẽ KHÔNG tự
    // thử lại trong trường hợp này, phải tự hẹn giờ. CONNECTING = rớt mạng, trình duyệt lo được.
    if (es.readyState === EventSource.CLOSED) {
      closeStream()
      scheduleReconnect(token)
    }
  }

  es.onmessage = (event) => {
    lastBeatAt = Date.now()
    try {
      const data = JSON.parse(event.data)

      // Phát hiện bỏ lỡ: server đánh số liên tục, số nhảy cóc nghĩa là có sự kiện đã rơi mất
      // trong lúc mình không kết nối. Số TỤT nghĩa là backend vừa khởi động lại (đếm từ đầu).
      const seq = typeof data.seq === 'number' ? data.seq : null
      if (seq !== null) {
        if (lastSeq !== 0 && seq !== lastSeq + 1) requestFullResync()
        lastSeq = seq
      }

      if (data.type === 'NEW_BOOKING') {
        // Chỉ nhân viên mới nhận được staffMessage (server lọc theo vai trò, không phải do UI ẩn đi).
        if (data.staffMessage && route.meta.requiresAuth) {
          showToast(data.staffMessage, 'success')
          playDing()

          // Browser Notification (bất chấp đang mở tab khác)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Kinh Lạc Gia Minh', {
              body: data.staffMessage,
              icon: '/favicon.ico'
            })
          }
        }
      }

      // Bất kể NEW_BOOKING / SLOT_UPDATED / SLOT_REMOVED, gửi event cập nhật âm thầm kèm payload vé.
      //
      // Nhân viên nhận thêm `staffSlot` — bản ĐẦY ĐỦ có patientId. Phải ưu tiên bản này, vì bảng
      // ngày của nhân viên lấy tên bệnh nhân từ patientId; vá bằng bản công khai (đã cắt trường
      // đó) là mỗi sự kiện lại xoá trắng tên trên màn hình. Bệnh nhân không bao giờ có staffSlot
      // (SseController lọc ở server), nên phía họ vẫn đúng là bản công khai.
      if (data.type === 'NEW_BOOKING' || data.type === 'SLOT_UPDATED' || data.type === 'SLOT_REMOVED') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('REFRESH_BOOKINGS', { detail: data.staffSlot || data.slot }),
          )
        }
      }
    } catch (e) {
      console.error('SSE Error:', e)
    }
  }
}

/**
 * Ép nối lại + đồng bộ NGAY khi có dấu hiệu đường dây có thể đã chết.
 *
 * Gọi khi: quay lại app, máy có mạng trở lại, hoặc đồng hồ canh chết kêu.
 */
function reviveStream() {
  const token = sseToken.value
  if (!token) return
  // Máy đang mất mạng hẳn: dựng lại cũng vô ích. Sự kiện 'online' sẽ gọi lại đúng lúc có sóng.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
    retryCount = 0
    connectSSE(token)
    requestFullResync()
    return
  }
  // Còn OPEN nhưng im quá lâu: trên di động, kết nối "còn sống" trên giấy tờ mà thực tế đã đứt
  // là chuyện thường. Dựng lại cho chắc.
  if (Date.now() - lastBeatAt > WATCHDOG_MS) {
    retryCount = 0
    connectSSE(token)
    requestFullResync()
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') reviveStream()
}

// ----- SEO & Zalo -----
const showZalo = computed(() => {
  return route.meta.requiresAuth !== true && route.meta.requiresPatientAuth !== true;
})

watch(
  () => route.fullPath,
  () => {
    const name = typeof route.name === 'string' ? route.name : ''
    const isPrivate = route.meta.requiresAuth === true || name === 'login'
    const seo: SeoData = routeSeo[name] ?? { ...defaultSeo, index: !isPrivate }
    applySeo(seo, route.path)
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
  <ZaloButton v-if="showZalo" />

  <!-- SSE Toasts Container Global -->
  <div class="sse-toasts-container">
    <TransitionGroup name="toast">
      <div v-for="toast in toastMessages" :key="toast.id" :class="['sse-toast', `toast-${toast.type}`]">
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="toast-content">
          <p>{{ toast.msg }}</p>
          <RouterLink v-if="toast.link" :to="toast.link" class="toast-link" @click="dismissToast(toast.id)">Xem chi tiết</RouterLink>
        </div>
        <button class="toast-close" @click="dismissToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ── SSE Toasts ── */
.sse-toasts-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999999;
  pointer-events: none;
}
.sse-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--white, #ffffff);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-left: 4px solid #9ca3af;
  width: 320px;
  max-width: calc(100vw - 48px);
}
.toast-success { border-left-color: #10b981; }
.toast-error { border-left-color: #ef4444; }
.toast-icon {
  flex-shrink: 0;
  color: #10b981;
  margin-top: 2px;
}
.toast-content {
  flex: 1;
}
.toast-content p {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.4;
}
.toast-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: #92400e;
  font-weight: 600;
  text-decoration: none;
}
.toast-link:hover { text-decoration: underline; }
.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  line-height: 1;
}
.toast-close:hover { color: #374151; }

/* Transitions */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(50px); }
.toast-leave-to { opacity: 0; transform: translateX(50px); }
</style>
