import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import './assets/styles/herb-label-card.css'
import { initTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { khoiDongBaoSuCo, baoLoi } from '@/lib/baoSuCo'

// Áp giao diện (màu theo ngày / theme đã ghim) trước khi render.
initTheme()

// Cắm bộ thu tín hiệu TRƯỚC khi tạo app: lỗi lúc khởi tạo cũng là lỗi, và đó lại là loại
// lỗi khó nghe ngóng nhất vì lúc đó chưa có giao diện nào để hiện thông báo.
khoiDongBaoSuCo()

const app = createApp(App)

// Lỗi trong render/lifecycle của Vue KHÔNG nổi lên `window.onerror` — Vue nuốt chúng để giữ
// app sống. Không cắm móc này thì cả một mảng lỗi lớn sẽ vô hình.
app.config.errorHandler = (err, _instance, info) => {
  const e = err as Error
  baoLoi({
    thongDiep: e?.message || String(err),
    stack: e?.stack,
    maLoi: e?.name || 'VUE_ERROR',
    nguCanh: { viTri: info },
  })
  console.error('[Vue]', err, info)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Làm mới thông tin + quyền từ server (nếu đã đăng nhập). Chạy nền, không chặn render.
const auth = useAuthStore(pinia)
if (auth.token) auth.fetchMe()

app.mount('#app')
