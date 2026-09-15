<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo, type SeoData } from '@/composables/useSeo'
import { routeSeo, defaultSeo } from '@/seo/routeSeo'
import ZaloButton from '@/components/ZaloButton.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// ----- SSE Notification (Realtime Bookings) -----
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const toastMessages = ref<{ id: number; type: string; msg: string; link?: string }[]>([])
let toastIdCounter = 0
let eventSource: EventSource | null = null

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

function connectSSE(token?: string) {
  if (eventSource) eventSource.close()
  
  const sseUrl = token ? `${API_BASE}/notifications/sse?token=${token}` : `${API_BASE}/notifications/sse`
  eventSource = new EventSource(sseUrl)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'NEW_BOOKING') {
        // CHỈ hiển thị Toast và Âm thanh nếu đang đứng ở màn hình Admin (requiresAuth = true)
        if (route.meta.requiresAuth) {
          // 1. Toast
          showToast(data.message, 'success')
          
          // 2. Phát âm thanh (Ting ting nhẹ nhàng bằng Web Audio API)
          if (typeof window !== 'undefined') {
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                // Tiếng ting trong trẻo
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
                
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.6);
              }
            } catch (e) {
              console.warn('Không thể phát âm thanh:', e)
            }
          }

          // 3. Browser Notification (bất chấp đang mở tab khác)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Kinh Lạc Gia Minh', {
              body: data.message,
              icon: '/favicon.ico'
            })
          }
        }
      }
      
      // Bất kể là NEW_BOOKING hay SLOT_UPDATED (huỷ/đóng/mở), gửi event reload data âm thầm kèm Payload Slot
      if (data.type === 'NEW_BOOKING' || data.type === 'SLOT_UPDATED') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('REFRESH_BOOKINGS', { detail: data.slot }))
        }
      }
    } catch (e) {
      console.error('SSE Error:', e)
    }
  }
}

onMounted(() => {
  // Yêu cầu quyền Thông báo khi mở trang
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  
  // Dù có hay chưa có login thì vẫn connect (Public nhận tín hiệu)
  connectSSE(authStore.token)
})

// Khi login/logout thì reconnect lại để báo danh với server
watch(() => authStore.token, (newToken) => {
  connectSSE(newToken)
})

onBeforeUnmount(() => {
  if (eventSource) eventSource.close()
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
