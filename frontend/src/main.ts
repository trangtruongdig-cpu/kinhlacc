import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { initTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'

// Áp giao diện (màu theo ngày / theme đã ghim) trước khi render.
initTheme()

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Làm mới thông tin + quyền từ server (nếu đã đăng nhập). Chạy nền, không chặn render.
const auth = useAuthStore(pinia)
if (auth.token) auth.fetchMe()

app.mount('#app')
