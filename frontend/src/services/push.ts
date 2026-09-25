/**
 * Thông báo đẩy (Firebase Cloud Messaging) cho bệnh nhân dùng WEB / PWA.
 *
 * NẰM IM nếu chưa cấu hình: thiếu bất kỳ biến VITE_FIREBASE_* nào là mọi hàm ở đây thoát ngay,
 * không nạp SDK, không xin quyền, không lỗi. Nhờ vậy môi trường dev và bản build chưa có khoá
 * vẫn chạy bình thường.
 *
 * CÁCH BẬT (một lần, trong Firebase Console của dự án):
 *   1. Project Settings › General › Your apps › thêm một Web App → chép đoạn cấu hình
 *   2. Project Settings › Cloud Messaging › Web Push certificates → "Generate key pair"
 *   3. Điền vào frontend/.env (hoặc biến build của Docker):
 *        VITE_FIREBASE_API_KEY=...
 *        VITE_FIREBASE_AUTH_DOMAIN=...
 *        VITE_FIREBASE_PROJECT_ID=...
 *        VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *        VITE_FIREBASE_APP_ID=...
 *        VITE_FIREBASE_VAPID_KEY=...        ← khoá ở bước 2
 *
 * Backend đã sẵn sàng: nó có sẵn service account và gửi qua FirebaseService.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  messagingSenderId: string
  appId: string
}

/** Đọc cấu hình từ biến môi trường. Thiếu một trường là coi như CHƯA bật. */
function readConfig(): { config: FirebaseWebConfig; vapidKey: string } | null {
  const env = import.meta.env as Record<string, string | undefined>
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
  const vapidKey = env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey || Object.values(config).some((v) => !v)) return null
  return { config: config as FirebaseWebConfig, vapidKey }
}

export function isPushConfigured(): boolean {
  return readConfig() !== null
}

/**
 * Service worker nhận cấu hình qua QUERY STRING.
 *
 * File trong `public/` được chép nguyên xi lúc build nên không đọc được `import.meta.env`.
 * Truyền qua query là cách gọn nhất; các giá trị này vốn là khoá CÔNG KHAI phía client
 * (Firebase thiết kế vậy), không phải bí mật.
 */
function swUrl(config: FirebaseWebConfig): string {
  const q = new URLSearchParams(config as unknown as Record<string, string>)
  return `/firebase-messaging-sw.js?${q.toString()}`
}

/** Nhớ token đã gửi để khỏi gọi API lại mỗi lần mở trang. */
const SENT_TOKEN_KEY = 'fcm_token_sent'

/**
 * Xin quyền, lấy token FCM và gửi lên máy chủ.
 *
 * CHỈ gọi sau một hành động rõ ràng của người dùng (bấm nút "Bật nhắc hẹn"). Trình duyệt phạt
 * nặng trang tự động bật hộp xin quyền lúc vừa mở, và Safari đòi hẳn một cử chỉ người dùng.
 *
 * @returns true nếu đã đăng ký xong
 */
export async function enablePush(patientId: number, authToken: string): Promise<boolean> {
  return dangKyToken(`/patients/${patientId}/fcm-token`, authToken)
}

/**
 * Bản dành cho NHÂN VIÊN — nhận cảnh báo sự cố hạng nặng của tab "Góp Ý & Lỗi".
 *
 * Tách endpoint chứ không dùng chung với bệnh nhân: token nhân viên phải nằm ở bảng `admins`,
 * và người gửi cảnh báo cần biết chắc mình chỉ bắn tin nội bộ cho nhân viên.
 */
export async function batPushNhanVien(authToken: string): Promise<boolean> {
  return dangKyToken('/su-co/fcm-token', authToken)
}

async function dangKyToken(duongDan: string, authToken: string): Promise<boolean> {
  const cfg = readConfig()
  if (!cfg) return false
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  if (!('Notification' in window)) return false

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Nạp LƯỜI: SDK Firebase khá nặng, đừng kéo vào bó mã của những người không dùng.
    const [{ initializeApp, getApps }, { getMessaging, getToken, isSupported }] =
      await Promise.all([import('firebase/app'), import('firebase/messaging')])

    // iOS chỉ hỗ trợ push khi trang đã được "Thêm vào màn hình chính"; isSupported() bắt việc đó.
    if (!(await isSupported())) return false

    const app = getApps().length ? getApps()[0]! : initializeApp(cfg.config)
    const registration = await navigator.serviceWorker.register(swUrl(cfg.config))
    const messaging = getMessaging(app)

    const token = await getToken(messaging, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: registration,
    })
    if (!token) return false

    // Token FCM đổi theo thời gian — gửi lại khi khác với lần trước.
    // Khoá nhớ gắn theo TỪNG endpoint: một máy vừa có phiên bệnh nhân vừa có phiên nhân viên
    // thì dùng chung khoá sẽ làm bên đăng ký sau tưởng mình đã gửi rồi và im lặng bỏ qua.
    const khoaNho = `${SENT_TOKEN_KEY}:${duongDan}`
    if (localStorage.getItem(khoaNho) === token) return true

    const res = await fetch(`${API_BASE}${duongDan}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    })
    if (!res.ok) return false

    try {
      localStorage.setItem(khoaNho, token)
    } catch {
      // Chế độ riêng tư chặn localStorage — chỉ mất tối ưu, lần sau gửi lại là cùng.
    }
    return true
  } catch (e) {
    console.warn('Không bật được thông báo đẩy:', e)
    return false
  }
}

/** Trạng thái quyền hiện tại, để nút trên giao diện hiển thị đúng. */
export function pushPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Quên token đã gửi (gọi lúc đăng xuất, kẻo máy dùng chung gửi nhầm cho người trước). */
export function forgetPushToken(): void {
  try {
    // Xoá mọi khoá theo endpoint (bệnh nhân lẫn nhân viên), kẻo máy dùng chung gửi nhầm
    // cảnh báo nội bộ cho người đăng nhập sau.
    for (const k of Object.keys(localStorage)) {
      if (k === SENT_TOKEN_KEY || k.startsWith(`${SENT_TOKEN_KEY}:`)) localStorage.removeItem(k)
    }
  } catch {
    // không sao
  }
}
