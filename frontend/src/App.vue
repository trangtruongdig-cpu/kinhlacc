<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo, type SeoData } from '@/composables/useSeo'
import { routeSeo, defaultSeo } from '@/seo/routeSeo'
import ZaloButton from '@/components/ZaloButton.vue'
import { useAuthStore } from '@/stores/auth'
import { usePatientAuthStore } from '@/stores/patientAuth'
import { useRealtimeStore } from '@/stores/realtime'

const route = useRoute()
const authStore = useAuthStore()
const patientAuthStore = usePatientAuthStore()

// Token dùng cho SSE: ưu tiên phiên nhân viên, không có thì dùng phiên bệnh nhân.
const sseToken = computed(() => authStore.token || patientAuthStore.token)

// ----- SSE Notification (Realtime Bookings) -----
//
// Kết nối và logic tự-lành nay nằm trong store `realtime` (stores/realtime.ts) — App.vue chỉ
// còn lo phần GIAO DIỆN: toast, tiếng ting, thông báo trình duyệt, và dải báo mất kết nối.
// Trước đây mọi thứ nằm ở đây rồi phát tin qua `window.dispatchEvent`, nên màn hình nào muốn
// nghe cũng phải tự gắn/gỡ listener trên window, không có kiểu dữ liệu, và không ai biết
// đường dây đang sống hay chết.
const realtime = useRealtimeStore()
const toastMessages = ref<{ id: number; type: string; msg: string; link?: string }[]>([])
let toastIdCounter = 0
let offStaffMessage: (() => void) | null = null
let offReminder: (() => void) | null = null

function showToast(msg: string, type = 'success', link?: string) {
  const id = toastIdCounter++
  toastMessages.value.push({ id, type, msg, link })
  // Nhắc hẹn là việc phải HÀNH ĐỘNG (sắp tới giờ khám) nên để lâu hơn hẳn tin báo thường.
  setTimeout(() => {
    toastMessages.value = toastMessages.value.filter(t => t.id !== id)
  }, type === 'reminder' ? 60000 : 10000)
}

function dismissToast(id: number) {
  toastMessages.value = toastMessages.value.filter(t => t.id !== id)
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

onMounted(() => {
  // Yêu cầu quyền Thông báo khi mở trang
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  // staffMessage chứa họ tên bệnh nhân nên server CHỈ gửi cho tài khoản nhân viên —
  // đây không phải chuyện UI ẩn đi.
  offStaffMessage = realtime.onStaffMessage((msg) => {
    if (!route.meta.requiresAuth) return
    showToast(msg, 'success')
    playDing()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Kinh Lạc Gia Minh', { body: msg, icon: '/favicon.ico' })
    }
  })

  // Nhắc hẹn: server chỉ gửi cho đúng bệnh nhân đó (lọc bằng targetPatientId), nên tới được
  // đây là đã đúng người. Hiện cả toast lẫn thông báo hệ thống — người bệnh có thể đang mở
  // tab khác.
  offReminder = realtime.onReminder((msg) => {
    showToast(msg, 'reminder')
    playDing()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Nhắc lịch trị liệu', { body: msg, icon: '/favicon.ico' })
    }
  })

  realtime.connect(sseToken.value)
})

// Nhân viên và bệnh nhân dùng HAI store khác nhau (access_token vs patient_token). Trước đây
// chỗ này chỉ đọc store nhân viên, nên phía bệnh nhân luôn không có token → SSE 401 → toàn bộ
// cập nhật realtime của phân hệ bệnh nhân chưa từng chạy.
watch(sseToken, (newToken) => {
  realtime.connect(newToken)
})

onBeforeUnmount(() => {
  if (offStaffMessage) offStaffMessage()
  if (offReminder) offReminder()
  realtime.disconnect()
})

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
  <!-- Mất kết nối realtime = dữ liệu trên màn hình có thể đã cũ. Nói thẳng ra, thay vì để người
       dùng nhìn một bảng lịch đứng im mà tưởng là đúng. -->
  <div v-if="realtime.isStale && sseToken" class="rt-offline-bar">
    <span class="rt-dot"></span>
    Mất kết nối máy chủ — đang thử lại. Dữ liệu hiển thị có thể chưa mới nhất.
  </div>

  <RouterView />
  <ZaloButton v-if="showZalo" />

  <!-- SSE Toasts Container Global -->
  <div class="sse-toasts-container">
    <TransitionGroup name="toast">
      <div v-for="toast in toastMessages" :key="toast.id" :class="['sse-toast', `toast-${toast.type}`]">
        <div class="toast-icon">
          <svg v-if="toast.type === 'reminder'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <svg v-else-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
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
/* ── Dải báo mất kết nối realtime ── */
.rt-offline-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #7c2d12;
  background: #fed7aa;
  border-bottom: 1px solid #fb923c;
}
.rt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea580c;
  animation: rt-pulse 1.2s ease-in-out infinite;
}
@keyframes rt-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

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
.toast-reminder { border-left-color: #b45309; }
.toast-reminder .toast-icon { color: #b45309; }
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
