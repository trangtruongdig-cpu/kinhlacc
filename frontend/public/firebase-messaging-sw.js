/* eslint-disable no-undef */
/**
 * Service worker nhận thông báo đẩy khi trang KHÔNG mở (hoặc đang ở tab khác).
 *
 * File này nằm trong public/ nên được chép nguyên xi lúc build — KHÔNG đọc được import.meta.env.
 * Cấu hình vì thế truyền qua query string lúc đăng ký (xem src/services/push.ts). Các giá trị
 * đó là khoá công khai phía client theo đúng thiết kế của Firebase, không phải bí mật.
 *
 * Chưa cấu hình Firebase thì file này không bao giờ được đăng ký, nên nằm im vô hại.
 */

const params = new URLSearchParams(self.location.search)
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
}

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  // Bản "compat" là bản DUY NHẤT dùng được bằng importScripts trong service worker.
  // Ghim đúng phiên bản: để 'latest' thì một bản Firebase mới có thể làm hỏng push mà không ai hay.
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Kinh Lạc Gia Minh'
    self.registration.showNotification(title, {
      body: payload.notification?.body || '',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-96.png',
      // Gộp theo vé: nhắc 1h rồi 30p rồi 15p thì thay thế nhau, không xếp chồng 3 thông báo.
      tag: payload.data?.slotId ? `slot-${payload.data.slotId}` : 'kinhlac',
      renotify: true,
      data: payload.data || {},
    })
  })
}

// Bấm vào thông báo: đưa về đúng trang lịch, và ưu tiên tab ĐANG MỞ thay vì mở thêm tab mới.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = '/app/schedule'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/app') && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
