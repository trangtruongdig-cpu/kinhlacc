import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/** Phần vé được phát cho MỌI người (khớp PublicSlotView ở backend). */
export interface PublicSlot {
  id: number
  slotDate: string
  slotTime: string
  /** Trạng thái ô giờ, hoặc 'REMOVED' khi ô giờ vừa bị xoá hẳn. */
  status: string
}

/** Bản ĐẦY ĐỦ của vé — chỉ tài khoản nhân viên nhận được (server lọc theo vai trò). */
export interface StaffSlot extends PublicSlot {
  patientId: number | null
  reason: string | null
  notes: string | null
}

export interface SlotEvent {
  type:
    | 'NEW_BOOKING'
    | 'SLOT_UPDATED'
    | 'SLOT_REMOVED'
    | 'DAY_REGENERATED'
    | 'APPOINTMENT_REMINDER'
  slot?: PublicSlot
  staffSlot?: StaffSlot
  /** Chỉ có ở DAY_REGENERATED — ngày vừa được sinh lại vé. */
  date?: string
  staffMessage?: string
  /** Nội dung nhắc hẹn (APPOINTMENT_REMINDER). Server chỉ gửi cho đúng bệnh nhân đó. */
  message?: string
  seq?: number
}

/**
 * Điều mà người nghe thật sự quan tâm.
 *
 * `slot` đã chọn sẵn bản tốt nhất cho vai trò hiện tại (nhân viên được bản đầy đủ).
 * `resync: true` nghĩa là "vừa nối lại, có thể đã bỏ lỡ sự kiện — tự nạp lại dữ liệu đi".
 */
export interface SlotChange {
  type: SlotEvent['type'] | 'RESYNC'
  slot: StaffSlot | PublicSlot | null
  date: string | null
  resync: boolean
}

type Handler = (change: SlotChange) => void

/** Không nhận được gì (kể cả nhịp tim 20s của server) quá ngần này → coi như đường dây đã chết. */
const WATCHDOG_MS = 55_000

/**
 * Một nơi DUY NHẤT giữ kết nối realtime cho cả ứng dụng.
 *
 * Trước đây logic này nằm trong App.vue và phát tin bằng `window.dispatchEvent`, nên mỗi màn
 * hình phải tự gắn/gỡ listener trên window, không có kiểu dữ liệu, và không màn hình nào biết
 * được đường dây đang sống hay chết. Nay gom về đây: các màn hình `subscribe()` và nhận đúng
 * kiểu, còn `isStale` cho phép hiện cảnh báo khi dữ liệu có thể đã cũ.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const status = ref<'idle' | 'connecting' | 'open' | 'retrying'>('idle')
  const lastEventAt = ref(0)

  /**
   * SSE bị đóng ở tầng HTTP TRONG KHI máy chủ vẫn trả lời request thường
   * → gần như chắc chắn token không còn hợp lệ, không phải mất mạng.
   *
   * Phân biệt được hai ca này là điều quan trọng: token hết hạn thì thử lại
   * bao nhiêu lần cũng 401, mà người dùng lại đọc được dòng "Mất kết nối
   * máy chủ" trong khi máy chủ hoàn toàn khoẻ.
   *
   * Store chỉ NÊU NGHI VẤN; việc xác thực token và dọn phiên do App.vue làm,
   * vì nhân viên và bệnh nhân dùng hai token khác nhau và store không biết
   * token đang giữ là của bên nào.
   */
  const nghiHetPhien = ref(false)

  /** Dữ liệu trên màn hình có thể đã cũ (mất kết nối) → nên báo cho người dùng biết. */
  const isStale = computed(() => status.value === 'retrying')

  let es: EventSource | null = null
  let token: string | null = null
  let lastBeatAt = 0
  let lastSeq = 0
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let watchdogTimer: ReturnType<typeof setInterval> | null = null
  let lifecycleBound = false

  const handlers = new Set<Handler>()

  /** Đăng ký nghe. Trả về hàm huỷ đăng ký — GỌI nó trong onBeforeUnmount. */
  function subscribe(fn: Handler): () => void {
    handlers.add(fn)
    return () => handlers.delete(fn)
  }

  function emit(change: SlotChange) {
    // Một người nghe ném lỗi thì không được làm chết những người còn lại.
    for (const fn of handlers) {
      try {
        fn(change)
      } catch (e) {
        console.error('Lỗi trong handler realtime:', e)
      }
    }
  }

  /** Báo mọi màn hình tự nạp lại — dùng sau khi nối lại, vì sự kiện lúc đứt mạch đã mất hẳn. */
  function requestResync() {
    emit({ type: 'RESYNC', slot: null, date: null, resync: true })
  }

  function closeStream() {
    if (es) {
      es.close()
      es = null
    }
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  /**
   * Máy chủ có còn trả lời không?
   *
   * Gọi một endpoint cần xác thực mà KHÔNG kèm token: máy chủ sống thì đáp
   * 401, chết/mất mạng thì fetch ném lỗi. Chỉ cần biết "có đáp hay không",
   * nên cách này không phụ thuộc token đang giữ là của nhân viên hay bệnh
   * nhân — hỏi bằng token sai loại sẽ ra 401 và kết luận oan.
   */
  async function mayChuConSong(): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/auth/me`, { method: 'GET', cache: 'no-store' })
      return true
    } catch {
      return false
    }
  }

  /** Backoff 3s → 6s → 12s → 24s → tối đa 30s (tránh nện server khi nó đang lỗi). */
  function scheduleReconnect() {
    if (!token || retryTimer) return
    status.value = 'retrying'
    const delay = Math.min(3000 * 2 ** retryCount, 30_000)
    retryCount += 1
    retryTimer = setTimeout(() => {
      retryTimer = null
      open()
    }, delay)
  }

  function open() {
    closeStream()
    if (!token) {
      status.value = 'idle'
      return
    }

    status.value = retryCount > 0 ? 'retrying' : 'connecting'
    const stream = new EventSource(
      `${API_BASE}/notifications/sse?token=${encodeURIComponent(token)}`,
    )
    es = stream
    lastBeatAt = Date.now()

    stream.onopen = () => {
      lastBeatAt = Date.now()
      status.value = 'open'
      nghiHetPhien.value = false
      // Lần mở ĐẦU TIÊN thì các màn hình tự nạp trong onMounted rồi, chỉ đồng bộ khi nối LẠI.
      if (retryCount > 0) requestResync()
      retryCount = 0
    }

    // Nhịp tim mang tên sự kiện riêng nên KHÔNG vào onmessage — bắt riêng để nuôi đồng hồ canh chết.
    stream.addEventListener('ping', () => {
      lastBeatAt = Date.now()
      status.value = 'open'
    })

    stream.onerror = () => {
      // Kết nối này đã bị thay bằng cái mới → bỏ qua, đừng để nó hẹn nối lại chồng lên.
      if (es !== stream) return
      // CLOSED = lỗi ở tầng HTTP (401 token hết hạn, 502 backend chết). Trình duyệt sẽ KHÔNG tự
      // thử lại trong trường hợp này, phải tự hẹn giờ. CONNECTING = rớt mạng, trình duyệt lo được.
      if (stream.readyState === EventSource.CLOSED) {
        closeStream()
        // Đừng vội hẹn nối lại: hỏi máy chủ một câu đã. Máy chủ vẫn trả lời
        // mà riêng SSE bị đóng thì lỗi nằm ở token, thử lại vô ích và còn
        // hiện sai thông báo "mất kết nối máy chủ".
        void (async () => {
          if (await mayChuConSong()) {
            nghiHetPhien.value = true
            status.value = 'idle'
            return
          }
          scheduleReconnect()
        })()
      } else {
        status.value = 'retrying'
      }
    }

    stream.onmessage = (event) => {
      lastBeatAt = Date.now()
      lastEventAt.value = lastBeatAt
      status.value = 'open'
      try {
        const data = JSON.parse(event.data) as SlotEvent

        // Phát hiện bỏ lỡ: server đánh số liên tục, số nhảy cóc nghĩa là có sự kiện đã rơi mất
        // trong lúc mình không kết nối. Số TỤT nghĩa là backend vừa khởi động lại (đếm từ đầu).
        if (typeof data.seq === 'number') {
          if (lastSeq !== 0 && data.seq !== lastSeq + 1) requestResync()
          lastSeq = data.seq
        }

        if (data.staffMessage) emitStaffMessage(data.staffMessage)

        if (data.type === 'APPOINTMENT_REMINDER') {
          if (data.message) emitReminder(data.message)
          return // không phải thay đổi vé, đừng bắt các màn hình vá lưới giờ
        }

        emit({
          type: data.type,
          // Nhân viên có staffSlot (đầy đủ patientId); bệnh nhân chỉ có bản công khai.
          slot: data.staffSlot || data.slot || null,
          date: data.date || data.slot?.slotDate || null,
          resync: false,
        })
      } catch (e) {
        console.error('SSE: không đọc được gói tin', e)
      }
    }
  }

  // Lời nhắc hẹn gửi riêng cho bệnh nhân. Server đã lọc theo danh tính (targetPatientId),
  // nên tới được đây nghĩa là đúng người — không cần lọc lại ở máy khách.
  const reminderHandlers = new Set<(msg: string) => void>()
  function onReminder(fn: (msg: string) => void): () => void {
    reminderHandlers.add(fn)
    return () => reminderHandlers.delete(fn)
  }
  function emitReminder(msg: string) {
    for (const fn of reminderHandlers) {
      try {
        fn(msg)
      } catch (e) {
        console.error('Lỗi trong handler nhắc hẹn:', e)
      }
    }
  }

  // Toast/âm thanh cho nhân viên do App.vue lo (nó giữ phần giao diện) — store chỉ chuyển tiếp.
  const staffMessageHandlers = new Set<(msg: string) => void>()
  function onStaffMessage(fn: (msg: string) => void): () => void {
    staffMessageHandlers.add(fn)
    return () => staffMessageHandlers.delete(fn)
  }
  function emitStaffMessage(msg: string) {
    for (const fn of staffMessageHandlers) {
      try {
        fn(msg)
      } catch (e) {
        console.error('Lỗi trong handler staffMessage:', e)
      }
    }
  }

  /**
   * Ép nối lại + đồng bộ NGAY khi có dấu hiệu đường dây có thể đã chết.
   * Gọi khi: quay lại app, máy có mạng trở lại, hoặc đồng hồ canh chết kêu.
   */
  function revive() {
    if (!token) return
    // Máy đang mất mạng hẳn: dựng lại cũng vô ích. Sự kiện 'online' sẽ gọi lại đúng lúc có sóng.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    if (!es || es.readyState === EventSource.CLOSED) {
      retryCount = 0
      open()
      requestResync()
      return
    }
    // Còn OPEN nhưng im quá lâu: trên di động, kết nối "còn sống" trên giấy tờ mà thực tế đã đứt
    // là chuyện thường. Dựng lại cho chắc.
    if (Date.now() - lastBeatAt > WATCHDOG_MS) {
      retryCount = 0
      open()
      requestResync()
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') revive()
  }

  function bindLifecycle() {
    if (lifecycleBound || typeof window === 'undefined') return
    lifecycleBound = true
    // Ba nguồn tín hiệu "có thể đã đứt": quay lại app, có mạng trở lại, và đồng hồ canh chết.
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', revive)
    window.addEventListener('pageshow', revive) // quay lại từ bfcache (Safari iOS)
    watchdogTimer = setInterval(() => {
      if (document.visibilityState === 'visible') revive()
    }, 20_000)
  }

  function unbindLifecycle() {
    if (!lifecycleBound || typeof window === 'undefined') return
    lifecycleBound = false
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('online', revive)
    window.removeEventListener('pageshow', revive)
    if (watchdogTimer) clearInterval(watchdogTimer)
    watchdogTimer = null
  }

  /** Đổi token (đăng nhập/đăng xuất/đổi vai trò) → dựng lại từ đầu. */
  function connect(newToken: string | null) {
    token = newToken
    retryCount = 0
    lastSeq = 0
    nghiHetPhien.value = false
    if (!newToken) {
      closeStream()
      status.value = 'idle'
      return
    }
    bindLifecycle()
    open()
  }

  function disconnect() {
    token = null
    closeStream()
    unbindLifecycle()
    status.value = 'idle'
  }

  return {
    status,
    isStale,
    nghiHetPhien,
    lastEventAt,
    subscribe,
    onStaffMessage,
    onReminder,
    connect,
    disconnect,
    revive,
  }
})
